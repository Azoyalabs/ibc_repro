import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { QueryClient, setupIbcExtension } from "@cosmjs/stargate";
import { setupBankExtension } from "@cosmjs/stargate";

const FETCH_MAINNET_RPC = "https://rpc-fetchhub.fetch.ai:443";
const FETCH_TESTNET_RPC = "https://rpc-dorado.fetch.ai:443";

async function main(rpc) {
  // Setting up the relevant extensions
  const tmClient = await Tendermint34Client.connect(rpc);
  const queryClient = new QueryClient(tmClient);
  const ibcExtension = setupIbcExtension(queryClient);
  const bankExtension = setupBankExtension(queryClient);

  // Supply lets us get ALL the native denominations on the network. We can access all defined IBC tokens this way
  const supply = await bankExtension.bank.totalSupply();

  // We're only interested in the IBC tokens and since their name from supply follows the format "ibc/xxxxxxxxxxxxxxxxxxxxx", we can just filter out
  const denominations = supply
    .map((c) => c.denom)
    .filter((d) => d.includes("ibc"));

  // convert hash encoded traces to actual tokens
  // this is the part that randomly failed
  const converted = await Promise.allSettled(
    denominations.map((d) => ibcExtension.ibc.transfer.denomTrace(d))
  );

  const mapped = new Map();

  // mapping them out for consumption
  converted.forEach((c, i) => {
    mapped.set(
      denominations[i],
      c.status === "fulfilled" ? c.value.denomTrace.baseDenom : "Unknown"
    );
  });
  return mapped;
}

main(FETCH_MAINNET_RPC).then(console.log);
