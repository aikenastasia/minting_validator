import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { applyParamsToScript, Constr, Data, fromText, MintingPolicy, mintingPolicyToId, toUnit, TxSignBuilder } from "@lucid-evolution/lucid";

import { ActionGroup } from "@/types/action";
import { Script } from "@/config/script";
import { useWallet } from "@/components/connection/context";

export default function Dashboard(props: { setActionResult: (result: string) => void; onError: (error: any) => void }) {
  const [connection] = useWallet();

  if (!connection) return <span className="uppercase">Wallet Disconnected</span>;

  const { api, lucid, address } = connection;

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    return txHash;
  }

  const actions: Record<string, ActionGroup> = {
    CheckRedeemer: {
      mint: async () => {
        try {
          if (!lucid.wallet()) lucid.selectWallet.fromAPI(api);

          const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.MintCheckRedeemer };
          const policyID = mintingPolicyToId(mintingValidator);

          const tokenName = "Hello World Token";
          const assetName = fromText(tokenName);

          const assetUnit = toUnit(policyID, assetName);
          const mintedAssets = { [assetUnit]: 200n };

          const helloWorld = fromText("Hello, World!");
          const redeemer = Data.to(helloWorld);

          const tx = await lucid
            .newTx()
            .mintAssets(mintedAssets, redeemer)
            .attach.MintingPolicy(mintingValidator)
            .attachMetadata(721, {
              [policyID]: {
                [assetName]: {
                  name: tokenName,
                  image: "https://avatars.githubusercontent.com/u/1",
                },
              },
              version: 2,
            })
            .validTo(new Date().getTime() + 15 * 60_000) // ~15 minutes
            .complete();

          submitTx(tx).then(props.setActionResult).catch(props.onError);
        } catch (error) {
          props.onError(error);
        }
      },

      burn: async () => {
        try {
          if (!lucid.wallet()) lucid.selectWallet.fromAPI(api);

          const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.MintCheckRedeemer };
          const policyID = mintingPolicyToId(mintingValidator);

          const tokenName = "Hello World Token";
          const assetName = fromText(tokenName);

          const assetUnit = toUnit(policyID, assetName);
          const burnedAssets = { [assetUnit]: -200n };

          const helloWorld = fromText("Hello, World!");
          const redeemer = Data.to(helloWorld);

          const utxos = await lucid.utxosAtWithUnit(address, assetUnit);

          const tx = await lucid
            .newTx()
            .collectFrom(utxos)
            .mintAssets(burnedAssets, redeemer)
            .attach.MintingPolicy(mintingValidator)
            .validTo(new Date().getTime() + 15 * 60_000) // ~15 minutes
            .complete();

          submitTx(tx).then(props.setActionResult).catch(props.onError);
        } catch (error) {
          props.onError(error);
        }
      },
    },

    CheckRedeemer2: {
      mint: async () => {
        try {
          if (!lucid.wallet()) lucid.selectWallet.fromAPI(api);

          const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.MintCheckRedeemer2 };
          const policyID = mintingPolicyToId(mintingValidator);

          const tokenName = "Consume UTxO Token";
          const assetName = fromText(tokenName);

          const assetUnit = toUnit(policyID, assetName);
          const mintedAssets = { [assetUnit]: 30n };

          const utxos = await lucid.wallet().getUtxos();
          const utxo = utxos[0];

          const txHash = String(utxo.txHash);
          const txIndex = BigInt(utxo.outputIndex);

          const outputReference = [txHash, txIndex];
          const isMinting = new Constr(1, []); // True

          const myRedeemer = new Constr(0, [outputReference, isMinting]);
          const redeemer = Data.to(myRedeemer);

          const tx = await lucid
            .newTx()
            .collectFrom([utxo])
            .mintAssets(mintedAssets, redeemer)
            .attach.MintingPolicy(mintingValidator)
            .attachMetadata(721, {
              [policyID]: {
                [assetName]: {
                  name: tokenName,
                  image: "https://avatars.githubusercontent.com/u/2",
                },
              },
              version: 2,
            })
            .validTo(new Date().getTime() + 15 * 60_000) // ~15 minutes
            .complete();

          submitTx(tx).then(props.setActionResult).catch(props.onError);
        } catch (error) {
          props.onError(error);
        }
      },

      burn: async () => {
        try {
          if (!lucid.wallet()) lucid.selectWallet.fromAPI(api);

          const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.MintCheckRedeemer2 };
          const policyID = mintingPolicyToId(mintingValidator);

          const tokenName = "Consume UTxO Token";
          const assetName = fromText(tokenName);

          const assetUnit = toUnit(policyID, assetName);
          const burnedAssets = { [assetUnit]: -30n };

          const outputReference = ["", 0n];
          const isMinting = new Constr(0, []); // False

          const myRedeemer = new Constr(0, [outputReference, isMinting]);
          const redeemer = Data.to(myRedeemer);

          const utxos = await lucid.utxosAtWithUnit(address, assetUnit);

          const tx = await lucid
            .newTx()
            .collectFrom(utxos)
            .mintAssets(burnedAssets, redeemer)
            .attach.MintingPolicy(mintingValidator)
            .validTo(new Date().getTime() + 15 * 60_000) // ~15 minutes
            .complete();

          submitTx(tx).then(props.setActionResult).catch(props.onError);
        } catch (error) {
          props.onError(error);
        }
      },
    },

    NFT: {
      mint: async () => {
        try {
          if (!lucid.wallet()) lucid.selectWallet.fromAPI(api);

          const utxos = await lucid.wallet().getUtxos();
          const utxo = utxos[0];

          const txHash = String(utxo.txHash);
          const txIndex = BigInt(utxo.outputIndex);

          const mintingScript = applyParamsToScript(Script.MintNFT, [txHash, txIndex]);
          const mintingValidator: MintingPolicy = { type: "PlutusV3", script: mintingScript };

          localStorage.setItem("nftMintingScript", mintingValidator.script);
          console.log({
            nftMintingScript: localStorage.getItem("nftMintingScript"),
          });

          const policyID = mintingPolicyToId(mintingValidator);

          const tokenName = "Action NFT";
          const assetName = fromText(tokenName);

          const assetUnit = toUnit(policyID, assetName);
          const mintedNFT = { [assetUnit]: 1n };

          const mint = new Constr(0, []);
          const redeemer = Data.to(mint);

          const tx = await lucid
            .newTx()
            .collectFrom([utxo])
            .mintAssets(mintedNFT, redeemer)
            .attach.MintingPolicy(mintingValidator)
            .attachMetadata(721, {
              [policyID]: {
                [assetName]: {
                  name: tokenName,
                  image: "https://avatars.githubusercontent.com/u/3",
                },
              },
              version: 2,
            })
            .validTo(new Date().getTime() + 15 * 60_000) // ~15 minutes
            .complete();

          submitTx(tx).then(props.setActionResult).catch(props.onError);
        } catch (error) {
          props.onError(error);
        }
      },

      burn: async () => {
        try {
          if (!lucid.wallet()) lucid.selectWallet.fromAPI(api);

          const nftMintingScript = localStorage.getItem("nftMintingScript");

          if (!nftMintingScript) throw "You must mint an NFT First!";

          const mintingValidator: MintingPolicy = { type: "PlutusV3", script: nftMintingScript };
          const policyID = mintingPolicyToId(mintingValidator);

          const tokenName = "Action NFT";
          const assetName = fromText(tokenName);

          const assetUnit = toUnit(policyID, assetName);
          const burnedNFT = { [assetUnit]: -1n };

          const burn = new Constr(1, []);
          const redeemer = Data.to(burn);

          const utxos = await lucid.utxosAtWithUnit(address, assetUnit);

          const tx = await lucid
            .newTx()
            .collectFrom(utxos)
            .mintAssets(burnedNFT, redeemer)
            .attach.MintingPolicy(mintingValidator)
            .validTo(new Date().getTime() + 15 * 60_000) // ~15 minutes
            .complete();

          submitTx(tx)
            .then((result) => {
              props.setActionResult(result);
              localStorage.clear();
            })
            .catch(props.onError);
        } catch (error) {
          props.onError(error);
        }
      },
    },
  };

  return (
    <div className="flex flex-col gap-2">
      <span>{address}</span>

      <Accordion variant="splitted">
        {/* Check Redeemer */}
        <AccordionItem key="1" aria-label="Accordion 1" title="Check Redeemer">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
              radius="full"
              onPress={actions.CheckRedeemer.mint}
            >
              Mint
            </Button>
            <Button
              className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
              radius="full"
              onPress={actions.CheckRedeemer.burn}
            >
              Burn
            </Button>
          </div>
        </AccordionItem>

        {/* Check Redeemer2 */}
        <AccordionItem key="2" aria-label="Accordion 2" title="Check Redeemer2">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
              radius="full"
              onPress={actions.CheckRedeemer2.mint}
            >
              Mint
            </Button>
            <Button
              className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
              radius="full"
              onPress={actions.CheckRedeemer2.burn}
            >
              Burn
            </Button>
          </div>
        </AccordionItem>

        {/* NFT */}
        <AccordionItem key="3" aria-label="Accordion 3" title="NFT">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize" radius="full" onPress={actions.NFT.mint}>
              Mint
            </Button>
            <Button className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize" radius="full" onPress={actions.NFT.burn}>
              Burn
            </Button>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
