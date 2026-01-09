import { useState, useEffect, useRef } from "react";
import { message } from "antd";
import MediaUpload from "./MediaUpload";
import { getDealSync, updateDealFields } from "../lib/api";
import TitleEditor from "./ContentEditor/TitleEditor";
import DescriptionEditor from "./ContentEditor/DescriptionEditor";
import NutshellEditor from "./ContentEditor/NutshellEditor";
import DealOptionsEditor from "./ContentEditor/DealOptionsEditor";
import FinePrintEditor from "./ContentEditor/FinePrintEditor";
import LocationsSection from "./LocationsSection";
import RedemptionMethodSection, { RedemptionMethod } from "./ContentEditor/RedemptionMethodSection";
import { DealOption, FinePointItem } from "./ContentEditor/types";
import { MediaItem } from "../data/mockDeals";
import { getLocationsByAccount, updateLocation } from "../data/locationData";
import { getMerchantAccount } from "../data/merchantAccounts";

interface ContentEditorProps {
  dealId: string;
  isNewDeal?: boolean;
  accountId?: string;
  onOptionSelect?: (option: any) => void;
  onOpenLibrary?: (libraryData: any) => void;
  onTitleSettingsOpen?: () => void;
  onContentChanges?: (hasChanges: boolean, changeCount?: number) => void;
  onContentPublish?: () => void;
  onRegisterPublish?: (publishFn: () => Promise<void>) => void;
  onSavingStateChange?: (isSaving: boolean) => void;
}

const ContentEditor = ({
  dealId,
  isNewDeal: _isNewDeal = false,
  accountId,
  onOptionSelect,
  onOpenLibrary,
  onTitleSettingsOpen,
  onContentChanges,
  onContentPublish,
  onRegisterPublish,
  onSavingStateChange,
}: ContentEditorProps) => {
  // Get deal data from localStorage (persistent)
  const [deal, setDeal] = useState(() => getDealSync(dealId));
  
  // Get merchant account data
  const merchantAccount = accountId ? getMerchantAccount(accountId) : undefined;

  // Auto-save state (enabled)
  const [autoSaveEnabled] = useState(true);
  const [, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [, setLastSaved] = useState<Date>(new Date());

  // Track render count to prevent initial unsaved changes flag
  const renderCount = useRef(0);

  // State for inline editing - now using persistent data
  const [originalTitle] = useState(deal.title); // Store the original title
  const [title, setTitle] = useState(deal.title);

  // Store original values for all title-related fields
  const [originalGalleryTitle] = useState(deal.galleryTitle);
  const [galleryTitle, setGalleryTitle] = useState(deal.galleryTitle);

  // Location state
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(
    deal.locationIds || []
  );
  const [originalLocationIds] = useState<string[]>(deal.locationIds || []);

  // Redemption method state
  const [redemptionMethod, setRedemptionMethod] = useState<RedemptionMethod>(
    (deal.redemptionMethod as RedemptionMethod) || "at-location"
  );
  const [originalRedemptionMethod] = useState<RedemptionMethod>(
    (deal.redemptionMethod as RedemptionMethod) || "at-location"
  );

  // Redemption instructions state
  const [redemptionInstructions, setRedemptionInstructions] = useState<string>(
    deal.redemptionInstructions || ""
  );
  const [originalRedemptionInstructions] = useState<string>(
    deal.redemptionInstructions || ""
  );
  const [isRedemptionInstructionsAuto, setIsRedemptionInstructionsAuto] = useState<boolean>(
    (deal as any).isRedemptionInstructionsAuto !== undefined 
      ? (deal as any).isRedemptionInstructionsAuto 
      : true
  );

  // Custom URL states
  const [customBookingUrl, setCustomBookingUrl] = useState<string>(
    deal.customBookingUrl || ""
  );
  const [customRedemptionUrl, setCustomRedemptionUrl] = useState<string>(
    deal.customRedemptionUrl || ""
  );

  // Dynamic values for redemption instructions
  const [redemptionPhone, setRedemptionPhone] = useState<string>(
    deal.redemptionPhone || ""
  );
  const [redemptionEmail, setRedemptionEmail] = useState<string>(
    deal.redemptionEmail || ""
  );
  const [redemptionLocationAddress, setRedemptionLocationAddress] = useState<string>(
    deal.redemptionLocationAddress || ""
  );
  const [redemptionBusinessHours, setRedemptionBusinessHours] = useState<string>(
    deal.redemptionBusinessHours || ""
  );
  const [redemptionValidityDays, setRedemptionValidityDays] = useState<number>(
    deal.redemptionValidityDays || 90
  );

  // Booking configuration for at-location
  const [bookingRequired, setBookingRequired] = useState<boolean>(
    (deal as any).bookingRequired || false
  );
  const [bookingHoursAhead, setBookingHoursAhead] = useState<number>(
    (deal as any).bookingHoursAhead || 1
  );
  const [bookingMethodOnline, setBookingMethodOnline] = useState<boolean>(
    (deal as any).bookingMethodOnline || false
  );
  const [bookingMethodPhone, setBookingMethodPhone] = useState<boolean>(
    (deal as any).bookingMethodPhone || false
  );
  const [bookingMethodEmail, setBookingMethodEmail] = useState<boolean>(
    (deal as any).bookingMethodEmail || false
  );
  const [bookingOnlineUrl, setBookingOnlineUrl] = useState<string>(
    (deal as any).bookingOnlineUrl || ""
  );
  const [bookingPhone, setBookingPhone] = useState<string>(
    (deal as any).bookingPhone || ""
  );
  const [bookingEmail, setBookingEmail] = useState<string>(
    (deal as any).bookingEmail || ""
  );

  // Online redemption type states
  const [onlineRedemptionType, setOnlineRedemptionType] = useState<"checkout" | "direct-link">(
    (deal as any).onlineRedemptionType || "checkout"
  );
  const [redemptionLinkUrl, setRedemptionLinkUrl] = useState<string>(
    (deal as any).redemptionLinkUrl || ""
  );
  const [redemptionCodeParameter, setRedemptionCodeParameter] = useState<string>(
    (deal as any).redemptionCodeParameter || "code"
  );

  const [originalShortDescriptor] = useState(deal.shortDescriptor);
  const [shortDescriptor, setShortDescriptor] = useState(deal.shortDescriptor);

  const [originalDescriptor] = useState(deal.descriptor);
  const [descriptor, setDescriptor] = useState(deal.descriptor);

  const [isGalleryTitleAuto, setIsGalleryTitleAuto] = useState(
    deal.isGalleryTitleAuto
  );
  const [isDescriptorAuto, setIsDescriptorAuto] = useState(
    deal.isDescriptorAuto
  );

  // Helper function to convert highlights from array to HTML if needed
  const convertHighlightsToHTML = (highlights: any) => {
    if (!highlights) return "<p></p>";
    if (typeof highlights === "string") return highlights;
    // If it's an array, convert to HTML list
    if (Array.isArray(highlights) && highlights.length > 0) {
      const items = highlights.map((h: any) => `<li>${h.text || h}</li>`).join("");
      return `<ul>${items}</ul>`;
    }
    return "<p></p>";
  };

  // Store snapshot of saved state for cancel functionality (auto-saved, safe from loss)
  const [savedState, setSavedState] = useState(() => ({
    title: deal.title,
    galleryTitle: deal.galleryTitle,
    shortDescriptor: deal.shortDescriptor,
    descriptor: deal.descriptor,
    description: deal.content.description,
    media: deal.content.media,
    nutshell: convertHighlightsToHTML(deal.content.highlights),
    finePoints: deal.content.finePoints || [],
    options: deal.options,
  }));

  // Store snapshot of published state (user explicitly published, badges cleared)
  const [publishedState, setPublishedState] = useState(() => ({
    title: deal.title,
    galleryTitle: deal.galleryTitle,
    shortDescriptor: deal.shortDescriptor,
    descriptor: deal.descriptor,
    description: deal.content.description,
    media: deal.content.media,
    nutshell: convertHighlightsToHTML(deal.content.highlights),
    finePoints: deal.content.finePoints || [],
    options: deal.options,
  }));

  // Store original values for history
  const [originalDescription] = useState(deal.content.description);
  const [description, setDescription] = useState(deal.content.description);
  const [media, setMedia] = useState<MediaItem[]>(deal.content.media);
  const [reels, setReels] = useState<MediaItem[]>([]);

  // Highlights (now Nutshell) state - convert from array to HTML if needed
  const [originalNutshell] = useState<string>(() => convertHighlightsToHTML(deal.content.highlights));
  const [nutshell, setNutshell] = useState<string>(() => convertHighlightsToHTML(deal.content.highlights));

  // Fine Print state
  const [originalFinePoints] = useState<FinePointItem[]>(deal.content.finePoints || []);
  const [finePoints, setFinePoints] = useState<FinePointItem[]>(deal.content.finePoints || []);

  // Map deal options to ContentEditor format
  const [options, setOptions] = useState<DealOption[]>(
    deal.options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      subtitle: opt.subtitle,
      details: opt.details,
      regularPrice: opt.regularPrice,
      grouponPrice: opt.grouponPrice,
      discount:
        opt.discount ||
        Math.round(
          ((opt.regularPrice - opt.grouponPrice) / opt.regularPrice) * 100
        ),
      validity: "Valid for 90 days",
      enabled: opt.enabled ?? opt.status === "Live",
      customFields: opt.customFields,
      monthlyCapacity: opt.monthlyCapacity || 100,
      merchantMargin: opt.merchantMargin || 50,
      grouponMargin: opt.grouponMargin || 50,
      merchantPayout: opt.merchantPayout,
      status: opt.status,
    }))
  );

  // Auto-save effect - triggers 2 seconds after last change
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      performSave(true);
    }, 2000); // 2 seconds is a good UX balance

    return () => clearTimeout(timer);
  }, [
    title,
    galleryTitle,
    descriptor,
    shortDescriptor,
    description,
    media,
    reels,
    options,
    nutshell,
    finePoints,
    redemptionMethod,
    redemptionInstructions,
    isRedemptionInstructionsAuto,
    customBookingUrl,
    customRedemptionUrl,
    redemptionPhone,
    redemptionEmail,
    redemptionLocationAddress,
    redemptionBusinessHours,
    redemptionValidityDays,
    bookingRequired,
    bookingHoursAhead,
    bookingMethodOnline,
    bookingMethodPhone,
    bookingMethodEmail,
    bookingOnlineUrl,
    bookingPhone,
    bookingEmail,
    autoSaveEnabled,
    hasUnsavedChanges,
  ]);

  // Auto-sync Gallery Title when in auto mode
  useEffect(() => {
    if (isGalleryTitleAuto) {
      setGalleryTitle(title);
    }
  }, [title, isGalleryTitleAuto]);

  // Auto-sync Descriptor when in auto mode
  useEffect(() => {
    if (isDescriptorAuto) {
      setDescriptor(title);
    }
  }, [title, isDescriptorAuto]);

  // Mark content as changed
  useEffect(() => {
    // Increment render count
    renderCount.current += 1;

    // Skip the first few renders to allow initial setup and auto-sync effects
    // This prevents false positives on initial mount
    if (renderCount.current <= 3) {
      return;
    }

    setHasUnsavedChanges(true);
  }, [
    title,
    galleryTitle,
    descriptor,
    shortDescriptor,
    isGalleryTitleAuto,
    isDescriptorAuto,
    description,
    media,
    reels,
    options,
    nutshell,
    selectedLocationIds,
    redemptionMethod,
    redemptionInstructions,
    isRedemptionInstructionsAuto,
    customBookingUrl,
    customRedemptionUrl,
    redemptionPhone,
    redemptionEmail,
    redemptionLocationAddress,
    redemptionBusinessHours,
    redemptionValidityDays,
    bookingRequired,
    bookingHoursAhead,
    bookingMethodOnline,
    bookingMethodPhone,
    bookingMethodEmail,
    bookingOnlineUrl,
    bookingPhone,
    bookingEmail,
  ]);

  // Helper function to count title changes (compare against published state)
  const countTitleChanges = () => {
    let count = 0;
    if (title !== publishedState.title) count++;
    if (galleryTitle !== publishedState.galleryTitle) count++;
    if (shortDescriptor !== publishedState.shortDescriptor) count++;
    if (descriptor !== publishedState.descriptor) count++;
    return count;
  };

  // Helper function to count media changes (compare against published state)
  const countMediaChanges = () => {
    let count = 0;
    // Check if media array length changed
    if (media.length !== publishedState.media.length) {
      count += Math.abs(media.length - publishedState.media.length);
    }
    // Check if media items were reordered or modified
    for (
      let i = 0;
      i < Math.min(media.length, publishedState.media.length);
      i++
    ) {
      if (
        media[i].id !== publishedState.media[i].id ||
        media[i].caption !== publishedState.media[i].caption ||
        media[i].isFeatured !== publishedState.media[i].isFeatured
      ) {
        count++;
      }
    }
    return count;
  };

  // Helper function to count option changes (compare against published state)
  const countOptionChanges = () => {
    let count = 0;
    // Check if options array length changed
    if (options.length !== publishedState.options.length) {
      count += Math.abs(options.length - publishedState.options.length);
    }
    // Check each option for changes
    for (
      let i = 0;
      i < Math.min(options.length, publishedState.options.length);
      i++
    ) {
      const currentOpt = options[i];
      const publishedOpt = publishedState.options.find(
        (o) => o.id === currentOpt.id
      );
      if (!publishedOpt) {
        count++;
        continue;
      }
      // Check key fields for changes
      if (
        currentOpt.name !== publishedOpt.name ||
        currentOpt.regularPrice !== publishedOpt.regularPrice ||
        currentOpt.grouponPrice !== publishedOpt.grouponPrice ||
        currentOpt.enabled !== publishedOpt.enabled
      ) {
        count++;
      }
    }
    return count;
  };

  // Helper function to count description changes (compare against published state)
  const countDescriptionChanges = () => {
    return description !== publishedState.description ? 1 : 0;
  };

  // Helper function to count nutshell changes (compare against original)
  const countNutshellChanges = () => {
    return nutshell !== originalNutshell ? 1 : 0;
  };

  // Helper function to count location changes (compare against original)
  const countLocationChanges = () => {
    // Compare arrays
    if (selectedLocationIds.length !== originalLocationIds.length) {
      return Math.abs(selectedLocationIds.length - originalLocationIds.length);
    }
    // Check if same locations (order doesn't matter)
    const sortedCurrent = [...selectedLocationIds].sort();
    const sortedOriginal = [...originalLocationIds].sort();
    return sortedCurrent.some((id, i) => id !== sortedOriginal[i]) ? 1 : 0;
  };

  // Helper function to count draft locations
  const countDraftLocations = () => {
    if (!accountId) return 0;
    const locations = getLocationsByAccount(accountId);
    // Only count draft locations that are selected for this deal
    return locations.filter(
      (loc) => loc.isDraft && selectedLocationIds.includes(loc.id)
    ).length;
  };

  // Helper function to count redemption method changes
  const countRedemptionMethodChanges = () => {
    return redemptionMethod !== originalRedemptionMethod ? 1 : 0;
  };

  // Helper function to count redemption instructions changes
  const countRedemptionInstructionsChanges = () => {
    return redemptionInstructions !== originalRedemptionInstructions ? 1 : 0;
  };

  // Helper function to count fine print changes
  const countFinePrintChanges = () => {
    if (finePoints.length !== originalFinePoints.length) {
      return Math.abs(finePoints.length - originalFinePoints.length);
    }
    // Check if any fine point text changed
    return finePoints.some((fp, i) => {
      const original = originalFinePoints.find(o => o.id === fp.id);
      return !original || original.text !== fp.text;
    }) ? 1 : 0;
  };

  // Helper to get total unpublished change count
  const getTotalUnpublishedCount = () => {
    let total = 0;
    if (countTitleChanges() > 0) total += 1; // Count as 1 section
    if (countMediaChanges() > 0) total += 1;
    if (countOptionChanges() > 0) total += 1;
    if (countDescriptionChanges() > 0) total += 1;
    if (countNutshellChanges() > 0) total += 1;
    if (countFinePrintChanges() > 0) total += 1;
    if (countLocationChanges() > 0) total += 1;
    if (countDraftLocations() > 0) total += 1;
    if (countRedemptionMethodChanges() > 0) total += 1;
    if (countRedemptionInstructionsChanges() > 0) total += 1;
    return total;
  };

  // Notify parent component when content changes
  useEffect(() => {
    if (onContentChanges) {
      const changeCount = getTotalUnpublishedCount();
      onContentChanges(changeCount > 0, changeCount);
    }
  }, [title, galleryTitle, shortDescriptor, descriptor, description, media, options, nutshell, selectedLocationIds, redemptionMethod, redemptionInstructions, isRedemptionInstructionsAuto, bookingRequired, bookingHoursAhead, bookingMethodOnline, bookingMethodPhone, bookingMethodEmail, bookingOnlineUrl, bookingPhone, bookingEmail]);

  // Register publish function with parent
  useEffect(() => {
    if (onRegisterPublish) {
      onRegisterPublish(performPublish);
    }
  }, [onRegisterPublish]);

  const performSave = async (isAutoSave: boolean = false) => {
    setIsSaving(true);
    onSavingStateChange?.(true);
    try {
      // Save to localStorage - now including ALL content fields
      const updatedDeal = await updateDealFields(dealId, {
        title,
        galleryTitle,
        shortDescriptor,
        descriptor,
        isGalleryTitleAuto,
        isDescriptorAuto,
        options,
        locationIds: selectedLocationIds,
        redemptionMethod,
        redemptionInstructions,
        isRedemptionInstructionsAuto,
        customBookingUrl,
        customRedemptionUrl,
        redemptionPhone,
        redemptionEmail,
        redemptionLocationAddress,
        redemptionBusinessHours,
        redemptionValidityDays,
        bookingRequired,
        bookingHoursAhead,
        bookingMethodOnline,
        bookingMethodPhone,
        bookingMethodEmail,
        bookingOnlineUrl,
        bookingPhone,
        bookingEmail,
        onlineRedemptionType,
        redemptionLinkUrl,
        redemptionCodeParameter,
        content: {
          description,
          media,
          highlights: nutshell, // Save nutshell as HTML string to highlights field
          finePoints, // Save fine points from state
        },
      } as any);

      // Update local deal state
      setDeal(updatedDeal);

      // Update saved state snapshot (for data safety, but keep badges visible)
      setSavedState({
        title,
        galleryTitle,
        shortDescriptor,
        descriptor,
        description,
        media,
        nutshell,
        finePoints,
        options,
      });

      setLastSaved(new Date());

      // Don't reset hasUnsavedChanges - user needs to publish to clear badges
      // Don't reset render count - we want to track changes vs published state

      if (!isAutoSave) {
        message.success("Changes saved successfully!");
      } else {
        // Show subtle message for auto-save
        message.success({
          content: "Auto-saved",
          duration: 1,
        });
      }
    } catch (error) {
      message.error("Failed to save changes");
    } finally {
      setIsSaving(false);
      onSavingStateChange?.(false);
    }
  };

  const performPublish = async () => {
    setIsSaving(true);
    onSavingStateChange?.(true);
    try {
      // First ensure everything is saved
      await performSave(false);

      // Publish all draft locations for this deal
      let draftLocationCount = 0;
      if (accountId) {
        const locations = getLocationsByAccount(accountId);
        const draftLocations = locations.filter(
          (loc) => loc.isDraft && selectedLocationIds.includes(loc.id)
        );
        
        for (const location of draftLocations) {
          updateLocation(accountId, location.id, { isDraft: false });
        }
        
        draftLocationCount = draftLocations.length;
      }

      // Update published state to match current state
      setPublishedState({
        title,
        galleryTitle,
        shortDescriptor,
        descriptor,
        description,
        media,
        nutshell,
        finePoints,
        options,
      });

      setHasUnsavedChanges(false);

      // Reset render count so change detection works properly after publish
      renderCount.current = 0;

      // Show success message with details about what was published
      if (draftLocationCount > 0) {
        message.success(
          `Changes published successfully! ${draftLocationCount} location${
            draftLocationCount === 1 ? "" : "s"
          } published.`
        );
      } else {
        message.success("Changes published successfully!");
      }

      // Notify parent component
      if (onContentPublish) {
        onContentPublish();
      }
    } catch (error) {
      message.error("Failed to publish changes");
    } finally {
      setIsSaving(false);
      onSavingStateChange?.(false);
    }
  };

  const handleCancel = () => {
    setTitle(savedState.title);
    setGalleryTitle(savedState.galleryTitle);
    setShortDescriptor(savedState.shortDescriptor);
    setDescriptor(savedState.descriptor);
    setHasUnsavedChanges(false);

    // Reset render count so change detection works properly after cancel
    renderCount.current = 0;

    message.info("Changes discarded");
  };

  const handlePreview = () => {
    message.info("Preview functionality coming soon");
    // TODO: Implement preview modal or open preview in new tab
  };

  return (
    <div>
      {/* Locale Switcher - Hidden for now */}
      {/* <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Globe size={16} color={token.colorTextSecondary} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Language:
          </Text>
          <Select
            value={selectedLocale}
            onChange={setSelectedLocale}
            style={{ width: 200 }}
            size="small"
            options={LOCALE_OPTIONS.map((locale) => ({
              value: locale.value,
              label: (
                <span>
                  {locale.flag} {locale.label}
                </span>
              ),
            }))}
          />
          <Divider type="vertical" />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Editing content for{" "}
            {LOCALE_OPTIONS.find((l) => l.value === selectedLocale)?.flag}{" "}
            {LOCALE_OPTIONS.find((l) => l.value === selectedLocale)?.label}
          </Text>
        </div>
      </Card> */}

      {/* Auto-save Status Bar - Hidden for prototype */}
      {/* {autoSaveEnabled && (
        <Alert
          message={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isSaving ? (
                  <>
                    <Spin size="small" />
                    <Text>Saving...</Text>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Clock size={14} color={token.colorWarning} />
                    <Text>Unsaved changes</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} color={token.colorSuccess} />
                    <Text>All changes saved</Text>
                  </>
                )}
              </div>
              <Divider type="vertical" />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Last saved: {formatLastSaved()}
              </Text>
              <Divider type="vertical" />
              <Button
                type="link"
                size="small"
                onClick={() => setAutoSaveEnabled(false)}
                style={{ padding: 0, height: "auto" }}
              >
                Disable auto-save
              </Button>
            </div>
          }
          type={isSaving ? "info" : hasUnsavedChanges ? "warning" : "success"}
          showIcon={false}
          style={{ marginBottom: 16 }}
          closable={false}
        />
      )}

      {!autoSaveEnabled && (
        <Alert
          message={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Text>
                Auto-save is disabled. Remember to save your changes manually.
              </Text>
              <Button
                type="link"
                size="small"
                onClick={() => setAutoSaveEnabled(true)}
                style={{ padding: 0, height: "auto" }}
              >
                Enable auto-save
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )} */}

      {/* Publish Button - Removed as status is now shown in fixed header at the top */}

      {/* Title Section */}
      <div id="title-section">
        <TitleEditor
          title={title}
          galleryTitle={galleryTitle}
          shortDescriptor={shortDescriptor}
          descriptor={descriptor}
          originalTitle={originalTitle}
          originalGalleryTitle={originalGalleryTitle}
          originalShortDescriptor={originalShortDescriptor}
          originalDescriptor={originalDescriptor}
          isGalleryTitleAuto={isGalleryTitleAuto}
          isDescriptorAuto={isDescriptorAuto}
          changeCount={countTitleChanges()}
          onTitleChange={setTitle}
          onGalleryTitleChange={setGalleryTitle}
          onShortDescriptorChange={setShortDescriptor}
          onDescriptorChange={setDescriptor}
          onIsGalleryTitleAutoChange={setIsGalleryTitleAuto}
          onIsDescriptorAutoChange={setIsDescriptorAuto}
          onCancel={handleCancel}
          onPreview={handlePreview}
          onTitleSettingsOpen={onTitleSettingsOpen}
          media={media}
        />
      </div>

      {/* Media Section */}
      <div id="media-section">
        <MediaUpload
          media={media}
          onMediaChange={setMedia}
          reels={reels}
          onReelsChange={setReels}
          onOpenLibrary={onOpenLibrary}
          changeCount={countMediaChanges()}
        />
      </div>

      {/* Deal Options - Now managed via sidebar in DealDetail.tsx */}
      {/* <div id="options-section">
        <DealOptionsEditor
          options={options}
          onOptionsChange={setOptions}
          onOptionSelect={onOptionSelect}
          changeCount={countOptionChanges()}
        />
      </div> */}

      {/* Nutshell Section */}
      <div id="nutshell-section">
        <NutshellEditor
          nutshell={nutshell}
          originalNutshell={originalNutshell}
          onNutshellChange={setNutshell}
        />
      </div>

      {/* Description Section */}
      <div id="description-section">
        <DescriptionEditor
          description={description}
          originalDescription={originalDescription}
          onDescriptionChange={setDescription}
        />
      </div>

      {/* Fine Print Section */}
      <div id="fine-print-section">
        <FinePrintEditor
          finePoints={finePoints}
          originalFinePoints={originalFinePoints}
          onFinePointsChange={setFinePoints}
        />
      </div>

      {/* Redemption Method Section */}
      <div id="redemption-method-section">
        <RedemptionMethodSection
          redemptionMethod={redemptionMethod}
          onRedemptionMethodChange={setRedemptionMethod}
          redemptionInstructions={redemptionInstructions}
          onRedemptionInstructionsChange={(e) => setRedemptionInstructions(e.target.value)}
          originalRedemptionInstructions={originalRedemptionInstructions}
          isRedemptionInstructionsAuto={isRedemptionInstructionsAuto}
          onIsRedemptionInstructionsAutoChange={setIsRedemptionInstructionsAuto}
          onlineRedemptionType={onlineRedemptionType}
          onOnlineRedemptionTypeChange={setOnlineRedemptionType}
          redemptionLinkUrl={redemptionLinkUrl}
          onRedemptionLinkUrlChange={setRedemptionLinkUrl}
          redemptionCodeParameter={redemptionCodeParameter}
          onRedemptionCodeParameterChange={setRedemptionCodeParameter}
          customBookingUrl={customBookingUrl}
          customRedemptionUrl={customRedemptionUrl}
          onCustomBookingUrlChange={setCustomBookingUrl}
          onCustomRedemptionUrlChange={setCustomRedemptionUrl}
          bookingRequired={bookingRequired}
          bookingHoursAhead={bookingHoursAhead}
          bookingMethodOnline={bookingMethodOnline}
          bookingMethodPhone={bookingMethodPhone}
          bookingMethodEmail={bookingMethodEmail}
          bookingOnlineUrl={bookingOnlineUrl}
          bookingPhone={bookingPhone}
          bookingEmail={bookingEmail}
          onBookingRequiredChange={setBookingRequired}
          onBookingHoursAheadChange={setBookingHoursAhead}
          onBookingMethodOnlineChange={setBookingMethodOnline}
          onBookingMethodPhoneChange={setBookingMethodPhone}
          onBookingMethodEmailChange={setBookingMethodEmail}
          onBookingOnlineUrlChange={setBookingOnlineUrl}
          onBookingPhoneChange={setBookingPhone}
          onBookingEmailChange={setBookingEmail}
          merchantWebsite={merchantAccount?.website}
          merchantPhone={merchantAccount?.phone}
          merchantEmail={merchantAccount?.contactEmail}
          merchantName={merchantAccount?.name}
          redemptionPhone={redemptionPhone}
          redemptionEmail={redemptionEmail}
          redemptionLocationAddress={redemptionLocationAddress}
          redemptionBusinessHours={redemptionBusinessHours}
          redemptionValidityDays={redemptionValidityDays}
          onRedemptionPhoneChange={setRedemptionPhone}
          onRedemptionEmailChange={setRedemptionEmail}
          onRedemptionLocationAddressChange={setRedemptionLocationAddress}
          onRedemptionBusinessHoursChange={setRedemptionBusinessHours}
          onRedemptionValidityDaysChange={setRedemptionValidityDays}
          changeCount={countRedemptionMethodChanges()}
          instructionsChangeCount={countRedemptionInstructionsChanges()}
        />
      </div>

      {/* Locations Section - Only show when redemption method is "at-location" */}
      {redemptionMethod === "at-location" && (
        <div id="locations-section">
          <LocationsSection
            accountId={accountId}
            selectedLocationIds={selectedLocationIds}
            onLocationChange={setSelectedLocationIds}
            changeCount={countLocationChanges()}
          />
        </div>
      )}
    </div>
  );
};

export default ContentEditor;
