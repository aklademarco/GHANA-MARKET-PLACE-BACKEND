import eslint from "@eslint/js";
import tseslint, { parser } from "typescript-eslint";

export default eslint.defineConfig(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project:true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        ignores:['dist/**','node_modules/**', 'drizzle/**' ]
    }
);