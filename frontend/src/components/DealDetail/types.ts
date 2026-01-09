export interface DealOptionDetailsContentProps {
  option: any;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onClose?: () => void; // Optional callback to close the sidebar view
  useDecimals?: boolean; // Whether to use decimal precision for prices
}

export interface TitleSettingsContentProps {
  title: string;
  galleryTitle: string;
  shortDescriptor: string;
  descriptor: string;
  originalTitle: string;
  originalGalleryTitle: string;
  originalShortDescriptor: string;
  originalDescriptor: string;
  isGalleryTitleAuto: boolean;
  isDescriptorAuto: boolean;
  onTitleChange: (title: string) => void;
  onGalleryTitleChange: (galleryTitle: string) => void;
  onShortDescriptorChange: (shortDescriptor: string) => void;
  onDescriptorChange: (descriptor: string) => void;
  onIsGalleryTitleAutoChange: (isAuto: boolean) => void;
  onIsDescriptorAutoChange: (isAuto: boolean) => void;
}

