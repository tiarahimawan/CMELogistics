import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

const client = new SESClient({ region: "ap-southeast-1" })
export const handler = (event, context, callback) => {
	sendMail("Testing AWS SES Emails", "Hello!")
}

async function sendMail(subject, data) {
	let responseData
	// TODO: change ToAddresses to the recipient's email
	const emailParams = {
		Destination: {
			ToAddresses: ["zrtan.2021@scis.smu.edu.sg"],
		},
		Message: {
			Body: {
				Text: { Data: data },
			},
			Subject: { Data: subject },
		},
		Source: "xyukimiku@gmail.com",
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
