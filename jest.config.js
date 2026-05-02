module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["./jest.setup.js"],
  testMatch: ["**/tests/unit/**/*.test.{js,jsx,ts,tsx}", "**/tests/integration/**/*.test.{js,jsx,ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(png|jpg|jpeg|gif|svg|webp)$": "<rootDir>/tests/unit/forms/__mocks__/fileMock.ts",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
    "^.+\\.(png|jpg|jpeg|gif|svg|webp)$": "jest-transform-stub",
  },
};
