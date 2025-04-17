const Corestore = require("corestore");
const Autobase = require("autobase");
(async () => {
  const store = new Corestore("./data");
  await store.ready();
  const local = store.get({ name: "local" });
  await local.ready();
  const autobase = new Autobase([local], {
    bootstrap: null,
    localInput: local,
  });
  await autobase.ready();
  console.log("Autobase created successfully!", autobase);
})().catch(console.error);
