import { DynamoDB } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import { v4 as uuidv4 } from "uuid"

const dynamo = DynamoDBDocument.from(new DynamoDB())
const lambda = new LambdaClient({
	region: "ap-southeast-1",
})

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

	const tableName = "order"

	let body
	let statusCode = "200"
	const headers = {
		"Content-Type": "application/json",
	}

	// we parse the body of the event only if it exists
	if (event.body) {
		event.body = JSON.parse(event.body)
	}

	try {
		switch (event.requestContext.http.method) {
			case "GET":
				if (!event.queryStringParameters) {
					// get all orders
					body = await dynamo.scan({
						TableName: tableName,
					})
				} else if (event.queryStringParameters.orderID) {
					// get only one order
					console.log(
						"getting order with orderID: ",
						event.queryStringParameters.orderID
					)
					body = await dynamo.get({
						TableName: tableName,
						Key: {
							orderID: event.queryStringParameters.orderID,
						},
					})
				} else if (event.queryStringParameters.driverID) {
					// get all orders by driver
					console.log(
						"getting all orders by driverID: ",
						event.queryStringParameters.driverID
					)
					body = await dynamo.scan({
						TableName: tableName,
						FilterExpression:
							"driverID = :driverID AND orderStatus = :orderStatus",
						ExpressionAttributeValues: {
							":driverID": event.queryStringParameters.driverID,
							":orderStatus": "In Transit",
						},
					})
				}
				break
			case "POST":
				// creating a new order
				// create a unique identifier for new order
				event.body["orderID"] = uuidv4()
				// we then update dynamoDB with the new order
				console.log("creating new order...", event.body)
				body = await dynamo.put({
					TableName: tableName,
					Item: event.body,
				})
				break
			case "PUT":
				let updateStatus
				let numUpdate
				// updating a currently existing order
				// check the type of update
				switch (event.queryStringParameters.updateType) {
					case "PICKUP":
						console.log("order has been picked up...")
						var order = await dynamo.get({
							TableName: tableName,
							Key: {
								orderID: event.queryStringParameters.orderID,
							},
						})
						order = order.Item
						updateStatus = {
							updateInfo: event.body.updateInfo,
							updateLocation: event.body.updateLocation,
							updateDateTime: new Date().toISOString(),
						}
						// we create the map for the orderUpdates since this is the first update
						order.orderStatus = "In Transit"
						order["orderUpdates"] = { 1: updateStatus }
						// now we put it into dynamoDB
						body = await dynamo.put({
							TableName: tableName,
							Item: order,
						})
						break
					case "TRANSIT":
						console.log("order is in transit...")
						var order = await dynamo.get({
							TableName: tableName,
							Key: {
								orderID: event.queryStringParameters.orderID,
							},
						})
						order = order.Item
						// we get the number of updates thus far, then add newest update
						numUpdate = Object.keys(order.orderUpdates).length + 1
						updateStatus = {
							updateInfo: event.body.updateInfo,
							updateLocation: event.body.updateLocation,
							updateDateTime: new Date().toISOString(),
						}
						order.orderUpdates[numUpdate.toString()] = updateStatus
						// now we put it into dynamoDB
						body = await dynamo.put({
							TableName: tableName,
							Item: order,
						})
						break
					case "DELIVERED":
						console.log("order has been delivered...")
						var order = await dynamo.get({
							TableName: tableName,
							Key: {
								orderID: event.queryStringParameters.orderID,
							},
						})
						order = order.Item
						// we get the number of updates thus far, then add newest update
						numUpdate = Object.keys(order.orderUpdates).length + 1
						updateStatus = {
							updateInfo: event.body.updateInfo,
							updateLocation: event.body.updateLocation,
							updateDateTime: new Date().toISOString(),
						}
						order.orderUpdates[numUpdate.toString()] = updateStatus
						order.orderStatus = "Delivered"
						// now we put it into dynamoDB
						body = await dynamo.put({
							TableName: tableName,
							Item: order,
						})

						// we invoke the sendEmailNotification lambda function
						const emailInput = {
							FunctionName: "sendEmailNotification",
							Payload: JSON.stringify({
								subject:
									"Update on your order with ID: " +
									order.orderID,
								data:
									`Please be informed that your order with ID: ` +
									order.orderID +
									`has been delivered as of ` +
									new Date().toString() +
									`.`,
								emailRecipient: order.recipientEmail,
							}),
							InvocationType: "Event",
						}
						const emailCommand = new InvokeCommand(emailInput)
						const response = await lambda.send(emailCommand)
						break
				}

				// we invoke the sendNotification lambda function
				const input = {
					FunctionName: "sendNotification",
					Payload: JSON.stringify({
						url: "https://g3vz6kar18.execute-api.ap-southeast-1.amazonaws.com/testStage/",
						options: {
							method: "POST",
						},
						data: order,
					}),
					InvocationType: "Event",
				}
				const command = new InvokeCommand(input)
				const response = await lambda.send(command)
				console.log(response)
				break
			default:
				throw new Error(`Unsupported method "${event.httpMethod}"`)
		}
	} catch (err) {
		statusCode = "400"
		body = err.message
	}

	body = JSON.stringify(body)

	return {
		statusCode,
		body,
		headers,
	}
}
