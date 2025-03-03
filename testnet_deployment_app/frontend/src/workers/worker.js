//@ts-nocheck
import {
  Account,
  ProgramManager,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoKeyProviderParams,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@provablehq/sdk";
import { expose, proxy } from "comlink";

await initThreadPool();

async function localProgramExecution(
  program,
  programName,
  aleoFunction,
  inputs
) {
  const programManager = new ProgramManager();

  // Create a temporary account for the execution of the program
  const account = new Account();
  programManager.setAccount(account);

  // Create a key provider in order to re-use the same key for each execution
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);
  programManager.setKeyProvider(keyProvider);

  // Pre-synthesize the program keys and then cache them in memory using key provider
  const keyPair = await programManager.synthesizeKeys(
    program,
    aleoFunction,
    inputs
  );
  programManager.keyProvider.cacheKeys(
    `${programName}:${aleoFunction}`,
    keyPair
  );

  // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
  // that was used to cache the keys in the previous step.
  const keyProviderParams = new AleoKeyProviderParams({
    cacheKey: `${programName}:${aleoFunction}`,
  });

  // Execute once using the key provider params defined above. This will use the cached proving keys and make
  // execution significantly faster.
  const executionResponse = await programManager.run(
    program,
    aleoFunction,
    inputs,
    true,
    undefined,
    keyProviderParams
  );
  return executionResponse.getOutputs();
}

async function getPrivateKey() {
  const key = new PrivateKey();
  return proxy(key);
}

async function deployProgram(program) {
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  // Create a record provider that will be used to find records and transaction data for Aleo programs
  const networkClient = new AleoNetworkClient(
    "https://api.explorer.provable.com/v1"
  );

  // Use existing account with funds
  const account = new Account({
    privateKey: "userPrivKey124",
  });

  const recordProvider = new NetworkRecordProvider(account, networkClient);

  // Initialize a program manager to talk to the Aleo network with the configured key and record providers
  const programManager = new ProgramManager(
    "https://api.explorer.provable.com/v1",
    keyProvider,
    recordProvider
  );

  programManager.setAccount(account);

  // Define a fee to pay to deploy the program
  const fee = 1.9; // 1.9 Aleo credits

  // Deploy the program to the Aleo network
  const tx_id = await programManager.deploy(program, fee);

  // Optional: Pass in fee record manually to avoid long scan times
  // const feeRecord = "{  owner: aleo1xxx...xxx.private,  microcredits: 2000000u64.private,  _nonce: 123...789group.public}";
  // const tx_id = await programManager.deploy(program, fee, undefined, feeRecord);

  return tx_id;
}

const workerMethods = { localProgramExecution, getPrivateKey, deployProgram };
expose(workerMethods);
