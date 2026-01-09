import React from "react";
import { Button } from "antd";
import FinePrintEditor from "../ContentEditor/FinePrintEditor";
import { FinePointItem } from "../ContentEditor/types";

export interface SettingsTabContentProps {
  // Fine Print
  finePoints: FinePointItem[];
  originalFinePoints: FinePointItem[];
  onFinePointsChange: (finePoints: FinePointItem[]) => void;

  // Actions
  onSave: () => void;
  hasUnsavedChanges: boolean;
}

const SettingsTabContent: React.FC<SettingsTabContentProps> = ({
  // Fine Print
  finePoints,
  originalFinePoints,
  onFinePointsChange,

  // Actions
  onSave,
  hasUnsavedChanges,
}) => {
  return (
    <div>
      {/* Save Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button type="primary" onClick={onSave} disabled={!hasUnsavedChanges}>
          Save Settings
        </Button>
      </div>

      {/* Fine Print Editor */}
      <FinePrintEditor
        finePoints={finePoints}
        originalFinePoints={originalFinePoints}
        onFinePointsChange={onFinePointsChange}
      />
    </div>
  );
};

export default SettingsTabContent;
