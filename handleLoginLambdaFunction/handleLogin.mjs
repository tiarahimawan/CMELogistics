import { DynamoDB } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocument, DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"
import jwt from 'jsonwebtoken';

const client = new DynamoDB({ region: "ap-southeast-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const tableName = 'Users';

export const handler = async (event, context) => {
    let body = JSON.parse(event.body);
    let username = body.username;
    let password = body.password;

    let params = {
        TableName: tableName,
        Key: {
            'username': username
        }
    };

    try {
        let data = await dynamodb.send(new GetCommand(params));

        if (data.Item && data.Item.password === password) {
            let token = jwt.sign({ username: username }, '', { algorithm: 'none' });
            return {
                statusCode: 200,
                body: JSON.stringify({ token: token })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }
    } catch (error) {
        console.error("Error fetching item from DynamoDB", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
