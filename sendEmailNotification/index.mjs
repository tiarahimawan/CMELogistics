import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

const client = new SESClient({ region: "ap-southeast-1" })
export const handler = (event, context, callback) => {
	console.log(event)
	sendMail(event.subject, event.data, event.emailRecipient)
}

async function sendMail(subject, data, recipient) {
	let responseData
	// TODO: change ToAddresses to the recipient's email
	const emailParams = {
		Destination: {
			ToAddresses: [recipient],
		},
		Message: {
			Body: {
				Text: { Data: data },
			},
			Subject: { Data: subject },
		},
		Source: "kotorichan79@gmail.com",
	}

	try {
		const command = new SendEmailCommand(emailParams)
		responseData = await client.send(command)
		console.log("MAIL SENT SUCCESSFULLY!!")
	} catch (e) {
		console.log("FAILURE IN SENDING MAIL!!", e)
	}
	return responseData
}
