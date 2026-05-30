import { VerificationProvider } from "./state/verification";
import { SelectionProvider } from "./state/selection";
import Console from "./components/Console";

export default function App() {
  return (
    <VerificationProvider>
      <SelectionProvider>
        <Console />
      </SelectionProvider>
    </VerificationProvider>
  );
}
