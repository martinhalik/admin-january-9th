import DealOptionsTable from "./DealOptionsTable";
import { DealOption } from "./types";

interface DealOptionsEditorProps {
  options: DealOption[];
  onOptionsChange: (options: DealOption[]) => void;
  onOptionSelect?: (option: DealOption) => void;
  changeCount?: number;
  useDecimals?: boolean;
}

const DealOptionsEditor = ({
  options,
  onOptionsChange,
  onOptionSelect,
  changeCount = 0,
  useDecimals = false,
}: DealOptionsEditorProps) => {
  return (
    <DealOptionsTable
      options={options}
      onOptionsChange={onOptionsChange}
      showStatus={false}
      showMerchantPayout={false}
      onOptionSelect={onOptionSelect}
      changeCount={changeCount}
      useDecimals={useDecimals}
    />
  );
};

export default DealOptionsEditor;
