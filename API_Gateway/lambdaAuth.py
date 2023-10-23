import jwt

OWN_SECRET = 'your_secret_key'  # fetch securely from AWS Secrets Manager or AWS Systems Manager Parameter Store
THIRD_PARTY_PUBLIC_KEY = 'third_party_public_key'  # This can be fetched dynamically if needed.

def generate_policy(principal_id, effect, resource):
    return {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource
                }
            ]
        }
    }

def lambda_handler(event, context):
    token = event['authorizationToken']
    method_arn = event['methodArn']
    
    try:
        # First, try validating with your own secret
        payload = jwt.decode(token, OWN_SECRET, algorithms=["HS256"])
        principal_id = payload.get('sub', '')  # Assuming 'sub' is the subject claim in your JWT
        return generate_policy(principal_id, 'Allow', method_arn)
        
    except jwt.InvalidTokenError:
        # If own token validation fails, try third-party public key
        try:
            payload = jwt.decode(token, THIRD_PARTY_PUBLIC_KEY, algorithms=["RS256"])  # Assuming RS256 for third-party
            principal_id = payload.get('sub', '')  # Adjust if the third-party uses a different claim for subject
            return generate_policy(principal_id, 'Allow', method_arn)
            
        except jwt.InvalidTokenError:
            # If third-party token validation also fails, deny access
            return generate_policy('user', 'Deny', method_arn)
        
    except jwt.ExpiredSignatureError:
        # Token has expired, deny access
        return generate_policy('user', 'Deny', method_arn)
