import * as https from "node:https"

/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */

export const handler = (event, context, callback) => {
	const req = https.request(event.url, event.options, (res) => {
		let body = ""
		console.log("Status:", res.statusCode)
		console.log("Headers:", JSON.stringify(res.headers))
		res.setEncoding("utf8")
		res.on("data", (chunk) => (body += chunk))
		res.on("end", () => {
			console.log("Successfully processed HTTPS response")
			// If we know it's JSON, parse it
			if (res.headers["content-type"] === "application/json") {
				body = JSON.parse(body)
			}
			// to log in cloudwatch that the api call was successful
			console.log(body)
			callback(null, body)
		})
	})
	req.on("error", callback)
	req.write(JSON.stringify(event.data))
	req.end()
}
