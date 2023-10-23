import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import jwt from 'jsonwebtoken';

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "ap-southeast-1" }); // Replace "YOUR_REGION" with your AWS region
const tableName = 'Users'; // Replace with your DynamoDB table name

function generatePolicy(principalId, effect, resource) {
    return {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }]
        }
    };
}

export const handler = async (event) => {
    const token = event.authorizationToken;
    const methodArn = event.methodArn;
    
    try {
        // Validate the JWT without a secret (not recommended for production use)
        const payload = jwt.decode(token, { algorithms: ["none"] });
        const principalId = payload.sub; // Assuming 'sub' is the subject claim in your JWT
        return generatePolicy(principalId, 'Allow', methodArn);
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            // If JWT validation fails, deny access
            return generatePolicy('user', 'Deny', methodArn);
        } else if (error instanceof jwt.TokenExpiredError) {
            // Token has expired, deny access
            return generatePolicy('user', 'Deny', methodArn);
        } else {
            console.error("Unknown error occurred:", error);
            throw error;
        }
    }
};
