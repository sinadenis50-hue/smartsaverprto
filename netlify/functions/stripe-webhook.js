const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

    if (!sig) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing stripe signature" }),
      };
    }

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const userId =
        session.client_reference_id ||
        session.metadata?.userId ||
        null;

      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing userId" }),
        };
      }

      const { error } = await supabase
        .from("profiles")
        .update({ is_pro: true })
        .eq("id", userId);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};