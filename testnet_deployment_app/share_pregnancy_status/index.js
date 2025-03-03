import {
  Account,
  initThreadPool,
  ProgramManager,
  AleoKeyProvider,
  AleoKeyProviderParams,
} from "@provablehq/sdk";

await initThreadPool();

const programName = "share_pregnancy_status.aleo";

const share_pregnancy_status_program = `
program ${programName};

struct HealthInfo:
    age as u8;
    weight as u8;
    height as u8;
    is_pregnant as boolean;


function share_status:
    input r0 as HealthInfo.private;
    output r0.is_pregnant as boolean.private;`;

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
    share_pregnancy_status_program,
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
  let executionResponse = await programManager.run(
    program,
    aleoFunction,
    inputs,
    true,
    undefined,
    keyProviderParams
  );
  console.log(
    "share_pregnancy_status/share_status executed - result:",
    executionResponse.getOutputs()
  );

  // Verify the execution using the verifying key that was generated earlier.
  if (programManager.verifyExecution(executionResponse)) {
    console.log("share_pregnancy_status/share_status execution verified!");
  } else {
    throw "Execution failed verification!";
  }
}

const start = Date.now();
console.log("Starting execute!");

// Create default HealthInfo data
const defaultHealthInfo = {
  age: 30,
  weight: 65,
  height: 170,
  is_pregnant: true,
};

// Convert the default data to the format expected by the Aleo program
const inputData = `{ age: ${defaultHealthInfo.age}u8, weight: ${defaultHealthInfo.weight}u8, height: ${defaultHealthInfo.height}u8, is_pregnant: ${defaultHealthInfo.is_pregnant} }`;

console.log("Adding default Data!");
console.log(inputData);
console.log("Finished adding default Data!");

await localProgramExecution(
  share_pregnancy_status_program,
  programName,
  "share_status",
  [inputData]
);
console.log("Execute finished!", Date.now() - start);
