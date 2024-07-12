module.exports = {
  roots: ["<rootDir>"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/?(*.)+(spec).ts*"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePathIgnorePatterns: [
    "<rootDir>/__tests__/__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist",
  ],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts}"],
  preset: "ts-jest",
  testEnvironment: "jsdom",
  verbose: true,
  testURL: "http://localhost/",
  testTimeout: 60000,
};
