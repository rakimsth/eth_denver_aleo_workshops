import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { useState } from "react";
import denver_share_pregnancy_status_program from "./programs/main.aleo?raw";
import { AleoWorker } from "./workers/AleoWorker";

const aleoWorker = AleoWorker();
function App() {
  const [account, setAccount] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [, setDeploying] = useState(false);
  const [inputData, setInputData] = useState({});
  const [isDisabled, setIsDisabled] = useState(true);
  const [visibleForm, setVisibleForm] = useState(false);
  const [programName] = useState("denver_share_pregnancy_status.aleo");

  const generateAccount = async () => {
    const key = await aleoWorker.getPrivateKey();
    setAccount(await key.to_string());
    setVisibleForm(true);
  };

  const handleFormSubmission = (e) => {
    e.preventDefault();
    const rawInputData = `{ age: ${inputData.age}u8, weight: ${inputData.weight}u8, height: ${inputData.height}u8, is_pregnant: ${inputData.is_pregnant} }`;
    setInputData(rawInputData);
    setIsDisabled(false);
  };

  async function execute() {
    setExecuting(true);
    const result = await aleoWorker.localProgramExecution(
      denver_share_pregnancy_status_program,
      programName,
      "share_status",
      [inputData]
    );
    setExecuting(false);
    alert(JSON.stringify(result));
  }

  async function deploy() {
    setDeploying(true);
    try {
      const result = await aleoWorker.deployProgram(share_pregnancy_status_program);
      console.log("Transaction:");
      console.log("https://explorer.hamp.app/transaction?id=" + result);
      alert("Transaction ID: " + result);
    } catch (e) {
      console.log(e);
      alert("Error with deployment, please check console for details");
    }
    setDeploying(false);
  }

  return (
    <>
      <h1>Pregnancy Check Aleo App</h1>
      <div className="card">
        <p>
          <button onClick={generateAccount}>
            {account
              ? `Account private key is ${JSON.stringify(account)}`
              : `Generate account to get started...`}
          </button>
        </p>
        {visibleForm && (
          <>
            <h2>Enter Personal Info</h2>
            <pre>
              <p>{JSON.stringify(inputData)}</p>
            </pre>
            <form onSubmit={(e) => handleFormSubmission(e)}>
              <div className="mb-3">
                <label className="form-label">Age</label>
                <input
                  className="form-control"
                  placeholder="Enter your Age"
                  onChange={(e) =>
                    setInputData((prev) => {
                      return { ...prev, age: Number(e.target.value) };
                    })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Weight in KG</label>
                <input
                  className="form-control"
                  placeholder="Weight in kg"
                  onChange={(e) =>
                    setInputData((prev) => {
                      return { ...prev, weight: Number(e.target.value) };
                    })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Height in cm</label>
                <input
                  className="form-control"
                  placeholder="Height in cm"
                  onChange={(e) =>
                    setInputData((prev) => {
                      return { ...prev, height: Number(e.target.value) };
                    })
                  }
                />
              </div>
              <div className="mb-3">
                <select
                  className="form-select"
                  onChange={(e) =>
                    setInputData((prev) => {
                      return {
                        ...prev,
                        is_pregnant: e.target.value === "yes" ? true : false,
                      };
                    })
                  }
                >
                  <option value="">Are you pregnant?</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <button className="btn btn-success">Submit</button>
            </form>
            <p className="m-3">
              <button disabled={isDisabled} onClick={execute} class="btn btn-danger">
                {executing ? `Executing...check console for details...` : `Execute ${programName}`}
              </button>
            </p>
          </>
        )}
      </div>

      {/* Advanced Section */}
      {/* <div className="card">
        <h2>Advanced Actions</h2>
        <p>
          Deployment on Aleo requires certain prerequisites like seeding your
          wallet with credits and retrieving a fee record. Check README for more
          details.
        </p>
        <p>
          <button disabled={deploying} onClick={deploy}>
            {deploying
              ? `Deploying...check console for details...`
              : `Deploy ${programName}`}
          </button>
        </p>
      </div> */}
    </>
  );
}

export default App;
