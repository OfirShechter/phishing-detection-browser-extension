import { isPhishingSite } from "../src/phishingDetector/phishingDetector";
import fetchMock from "jest-fetch-mock";
import vectorizerData from "../public/model/vectorizer.json";
import logisticRegressionModelData from "../public/model/logistic_regression_model.json";
import { initialize } from "../src/phishingDetector/initializeModel";

fetchMock.enableMocks();
  
// jest.mock("../src/phishingDetector/urlTypePredict", () => ({
//   urlTypePredict: jest.fn((url: string) => url.includes("phishing")),
// }));

describe("isPhishingSite", () => {
    beforeAll(async () => {
        fetchMock.mockImplementation((args_0: string | Request | undefined) => {
            const url = typeof args_0 === "string" ? args_0 : args_0?.url || "";
            if (url == "/model/vectorizer.json") {
                return Promise.resolve(new Response(JSON.stringify(vectorizerData)));
            } else if (url == "/model/logistic_regression_model.json") {
                return Promise.resolve(new Response(JSON.stringify(logisticRegressionModelData)));
            }
            return Promise.reject(new Error("Unknown URL"));
        });
        await initialize();
    });
  it("should return true for phishing URLs", () => {
    expect(isPhishingSite("http://webmasteradmin.ukit.me/")).toBe(true);
  });

  it("should return false for safe URLs", () => {
    expect(isPhishingSite("https://www.google.com")).toBe(false);
  });
});