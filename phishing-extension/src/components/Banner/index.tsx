import { PhishingStatus } from "../../types/state.type";
import { BannerContainer } from "./styles";

export const phishingStatusText: Record<PhishingStatus, string> = {
  [PhishingStatus.PHISHING]: '⚠️ This site may be a phishing attempt!',
  [PhishingStatus.LEGITIMATE]: '✅ This site looks safe.',
  [PhishingStatus.PROCESSING]: '🔄 Checking...',
  [PhishingStatus.EXTENSION_INITIALIZING]: '🔄 Initializing Extension',
  [PhishingStatus.ERROR]: '❗ An error occurred while checking the site.',
};

export const Banner: React.FC<{ phishingState: PhishingStatus }> = ({ phishingState }) => {
  const text = phishingStatusText[phishingState] || '❗ No status available ❗';

  return (
    <BannerContainer phishingState={phishingState}>
      {text}
    </BannerContainer>
  )
}
