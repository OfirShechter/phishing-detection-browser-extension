import { loadPyodide } from "pyodide";

async function initialize() {
  console.time("Loading Pyodide and Packages");
  const pyodide = await loadPyodide();
  await pyodide.loadPackage("scikit-learn");
  // await pyodide.loadPackage("joblib");
  // await pyodide.loadPackage("numpy");

  // Fetch the vectorizer pickle file from the local server
  const response = await fetch(
    "http://localhost:8080/src/model/vectorizer.pkl"
  );
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Write the pickle file to Pyodide's virtual filesystem
  pyodide.FS.writeFile("vectorizer.pkl", uint8Array);

  // Fetch the model pickle file from the local server
  const modelResponse = await fetch(
    "http://localhost:8080/src/model/decision_tree_model.pkl"
  );
  const modelArrayBuffer = await modelResponse.arrayBuffer();
  const modelUint8Array = new Uint8Array(modelArrayBuffer);

  // Write the model file to Pyodide's virtual filesystem
  pyodide.FS.writeFile("decision_tree_model.pkl", modelUint8Array);

  await pyodide.runPythonAsync(`
        import joblib

        # Load the vectorizer and decision tree model as global variables
        global vectorizer, decision_tree_model
        vectorizer = joblib.load('vectorizer.pkl')
        decision_tree_model = joblib.load('decision_tree_model.pkl')
    `);
  console.timeEnd("Loading Pyodide and Packages");
  return pyodide;
}

initialize().then((pyodide) => {
  console.time("Prediction Time");
  const url = "http://atualizacaodedados.online"; // Example URL to test
  // Run Python code to load the pickle and transform the URL
  const features = pyodide.runPython(`
        # Use the globally loaded models to transform the URL and predict
        features = vectorizer.transform([${JSON.stringify(url)}])
        y_pred_dt = decision_tree_model.predict(features)
        print("Prediction:", y_pred_dt)  # Print the prediction for debugging
        1 if y_pred_dt[0] == 'phishing' else 0  # Return 1 for phishing, 0 for not phishing
    `);
  console.timeEnd("Prediction Time");
  console.log("Is phishing:", features); // Check if the prediction is 1 (phishing)
});
