import { TextScanner } from "./components/TextScanner";
import { TypeExplorer } from "./components/TypeExplorer";

export function App() {
  return (
    <div className="container-fluid py-4 px-4">
      <header className="mb-4">
        <h1 className="display-6 fw-bold mb-1">@budiauktioner/buildi-primitives</h1>
        <p className="lead text-body-secondary mb-0">
          TypeScript library for validating, normalizing, masking, and scanning Swedish, EU, and
          international value-object primitives. This page is the React equivalent of the Blazor
          demo and runs entirely in the browser against the local source.
        </p>
      </header>

      <TextScanner />

      <hr className="my-4" />

      <TypeExplorer />

      <footer className="text-body-secondary small mt-5">
        Source: <code>js/samples/web</code> · Library: <code>@budiauktioner/buildi-primitives</code>
      </footer>
    </div>
  );
}
