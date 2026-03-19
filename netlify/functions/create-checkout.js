const Stripe = require("stripe");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = JSON.parse(event.body || "{}");
    const { userId, email } = body;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing userId" }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna", "bancontact", "eps"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "SmartSaver Pro",
            },
            unit_amount: 499,
          },
          quantity: 1,
        },
      ],

      client_reference_id: userId,

      customer_email: email || undefined,

      metadata: {
        userId: userId,
        email: email || "",
      },

      success_url: "https://smartsaverpro-git.netlify.app/?success=true",
      cancel_url: "https://smartsaverpro-git.netlify.app/?canceled=true",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Server error",
      }),
    };
  }
};