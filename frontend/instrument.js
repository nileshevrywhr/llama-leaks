import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://33881920c473b9003c975ed7a4cdbbe2@o4509549105512448.ingest.de.sentry.io/4509578391191632",

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  integrations: [
  ],

});
