// tokensToNumber.ts
import { encode } from "gpt-tokenizer/model/gpt-3.5-turbo";

type Weights = {
  linear_weight: number[][]; // [ [w] ]
  linear_bias: number[];     // [b]
};

export class TokensToNumber {
  private weight: number;
  private bias: number;

  constructor(modelData: Weights) {
    this.weight = modelData.linear_weight[0][0];
    this.bias = modelData.linear_bias[0];
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  forward(tokens: number[]): number {
    let maxVal = -Infinity; // Initialize to the smallest possible value

    tokens.forEach((tokenNum) => {
        const val = this.weight * tokenNum + this.bias
        if (val > maxVal) {
            maxVal = val; // Update maxVal if the current value is greater
        }
    });

    if (maxVal === -Infinity) return 0.0;

    return this.sigmoid(maxVal); // Apply sigmoid to the maximum value

  }
}
