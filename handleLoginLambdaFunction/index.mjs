import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import jwt from 'jsonwebtoken';

const client = new DynamoDB({ region: "ap-southeast-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const tableName = 'Users';

export const handler = async (event) => {
    // CORS preflight response
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Adjust the allowed origin to match your front-end domain
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS, POST",
            },
            body: JSON.stringify({ message: "CORS preflight" }),
        };
    }

    if (!event.body) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Invalid request body' }),
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Could not parse request body' }),
        };
    }

    const { username, password } = body;

    if (!username || !password) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Username and password are required' }),
        };
    }

    const params = {
        TableName: tableName,
        Key: {
            'username': username
        }
    };

    try {
        const { Item } = await dynamodb.send(new GetCommand(params));

        if (Item && Item.password === password) {
            // Here we sign the token without a secret for demonstration purposes.
            const token = jwt.sign({ username: username }, '', { algorithm: 'none' });
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: token }),
            };
        } else {
            return {
                statusCode: 401,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ error: 'Invalid credentials' }),
            };
        }
    } catch (error) {
        console.error("Error fetching item from DynamoDB", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
