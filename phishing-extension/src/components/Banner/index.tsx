import { BannerContainer } from "./styles"

export const Banner: React.FC<{ isPhishing: boolean }> = ({ isPhishing }) => {
    return (
      <BannerContainer isPhishing={isPhishing}>
        {isPhishing ? '⚠️ This site may be a phishing attempt!' : '✅ This site looks safe.'}
      </BannerContainer>
    )
  }
  