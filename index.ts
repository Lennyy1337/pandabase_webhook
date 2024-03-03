// imports
import Fastify from "fastify";
import crypto from "crypto";
import discord from "discord.js";
import dotenv from 'dotenv';

dotenv.config()

const secret =
  process.env.SECRET as string

const discord_wh =
  process.env.WEBHOOKURL as string

const fastify = Fastify({
  logger: true,
});

fastify.post("/webhook", async function (request, reply) {
  try{
    const signature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(request.body))
    .digest("hex");

    if (request.headers["x-pandabase-signature"] !== signature) {
      reply.status(403).send("forbidden");
      return;
    }

    const body: any = request.body;
    let content: any = undefined
    let color: any = undefined
    let email: any = undefined
    switch (body.event.type){
      case "order.transaction.pending":
        content = "New Pending Transaction!"
        color = "#FFBF00"
        break;
      case "order.transaction.success" || "order.transaction.paid":
        content = "Order has been Paid!"
        color = "#66FF00"
        break;
      case "order.transaction.refunded":
        content = "Order has been Refunded!"
        color = "#CC5500"
        break;
      case "order.transaction.disputed":
        content = "A dispute has been detected!"
        color = "#880808"
      case "order.transaction.not_paid":
        content = "Order has not been paid."
        color = "#CC5500"
      case "order.transaction.failed":
        content = "Transaction Failed!"
        color = "#880808"
    }

    if (!body) {
      reply.status(400).send("No body");
      return;
    }
    if (!body.event.data.email){
      email = "[NOT FOUND]"
    }else{
      email = body.event.data.email
    }
    const webhook = new discord.WebhookClient({ url: discord_wh });
    const embed = new discord.EmbedBuilder()
      .setTitle(body.object)
      .addFields(
          { name: "Status", value: body.event.data.status},
          { name: "Order ID", value: body.event.data.order_id},
          { name: "E-Mail", value: email},
          { name: "Payment Amount", value: `$${body.event.data.amount / 100}`}
      )
      .setColor(color);

    webhook.send({
      username: "Pandabase Events",
      avatarURL:
        "https://cdn.discordapp.com/icons/1162144928596508733/72986a36a8e328d06c99a16b0dc5e603.png?size=4096",
      embeds: [embed],
    });
    reply.send(200)
    console.log("Successful request!")
  }catch(e){
    console.log(e)
    reply.status(500).send("messed up")
  }
  
});

fastify.listen({ port: 5000, host: "0.0.0.0" });
