import { DynamoDB } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

const dynamo = DynamoDBDocument.from(new DynamoDB())

/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
export const handler = async (event) => {
	console.log("Received event:", JSON.stringify(event, null, 2))

	let body
	let statusCode = "200"
	const headers = {
		"Content-Type": "application/json",
	}

	try {
		switch (event.httpMethod) {
			case "DELETE":
				body = await dynamo.delete(JSON.parse(event.body))
				break
			case "GET":
				if (event.queryStringParameters.orderID) {
					// get only one order
					console.log(
						"getting order with orderID: ",
						event.queryStringParameters.orderID
					)
					body = await dynamo.get({
						TableName: event.queryStringParameters.TableName,
						Key: {
							orderID: Number(
								event.queryStringParameters.orderID
							),
						},
					})
				} else {
					console.log("getting all orders...")
					body = await dynamo.scan({
						TableName: event.queryStringParameters.TableName,
					})
				}
				break
			case "POST":
				// creating a new order
				const newUUID = uuidv4()
				// create a unique identifier for new order
				event.body.orderID = uuidv4()
				// we then update dynamoDB with the new order
				console.log("creating new order...", event.body)
				body = await dynamo.put(JSON.parse(event.body))
				break
			case "PUT":
				body = await dynamo.update(JSON.parse(event.body))
				break
			default:
				throw new Error(`Unsupported method "${event.httpMethod}"`)
		}
	} catch (err) {
		statusCode = "400"
		body = err.message
	} finally {
		// body = JSON.stringify(body);
	}

	return {
		statusCode,
		body,
		headers,
	}
}
