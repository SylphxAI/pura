# @sylphx/pura

## 1.0.0

### Major Changes

- **BREAKING CHANGE:** Remove `repura()` function

  The `repura()` function has been removed as it was redundant. It was functionally identical to `pura(unpura(value))`.

  **Migration:**

  ```typescript
  // Before
  import { repura } from "pura";
  const optimized = repura(data);

  // After
  import { pura, unpura } from "pura";
  const optimized = pura(unpura(data));
  ```

  **Note:** In most cases, you don't need to manually re-wrap data. The `produce()` and `produceFast()` functions handle wrapping automatically.

  **Other changes:**

  - Added comprehensive documentation site at https://pura.sylphx.com
  - Published as `@sylphx/pura` on npm
  - Updated all API documentation and guides
