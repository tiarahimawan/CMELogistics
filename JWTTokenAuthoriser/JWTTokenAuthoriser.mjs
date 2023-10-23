import boto3
import jwt

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('YourTableName')  # Replace 'YourTableName' with your DynamoDB table name

def get_secret_from_dynamodb():
    # Fetch the secret from DynamoDB
    response = table.get_item(
        Key={
            'YourPrimaryKeyName': 'YourPrimaryKeyValue'  # Replace with your primary key details
        }
    )
    
    # Assuming the secret is stored in a column named 'SecretColumn'
    return response['Item']['SecretColumn']

# Fetch secrets from DynamoDB
OWN_SECRET = get_secret_from_dynamodb()
THIRD_PARTY_PUBLIC_KEY = 'third_party_public_key'  # Adjust accordingly if this is stored somewhere else

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
