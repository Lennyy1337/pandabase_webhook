// imports
import Fastify from "fastify";
import crypto from "crypto";
import discord from "discord.js";

const secret =
  "pb_key_b54bad5dc3225de1e16cb0726b75927a68c775c8feef1503c7fe8dbdaa0bd01e";

const discord_wh =
  "https://canary.discord.com/api/webhooks/1200915220869152949/TEA6kEiVmuUaC-T7k0aOpzyla7z0wSKxtJuXswCfVZx4TvBZ6NPppPIBPrcKN_tBldul";

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
        color = "#AAFF00"
        break;
      case "order.transaction.refunded":
        content = "Order has been Refunded!"
        color = "#CC5500"
        break;
      case "order.transaction.disputed":
        content = "A dispute has been detected! @👑 │ Owner @🔥 | Nexus Manager"
        color = "#880808"
      case "order.transaction.not_paid":
        content = "Order has not been paid."
        color = "#CC5500"
      case "order.transaction.failed":
        content = "Transaction Failed!"
        color = "#880808"
    }

    if (!body) {
      reply.status(403).send("forbidden");
      return;
    }
    if (!body.event.data.email){
      email = "[NOT FOUND]"
    }else{
      email = body.event.data.email
    }
    const webhook = new discord.WebhookClient({ url: discord_wh });
    console.log(body)
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
  }catch(e){
    console.log(e)
  }
  
});

fastify.listen({ port: 5000, host: "0.0.0.0" });