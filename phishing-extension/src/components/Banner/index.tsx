import { BannerContainer } from "./styles"

export const Banner: React.FC<{ isPhishing: boolean | null }> = ({ isPhishing }) => {
  return (
    <BannerContainer isPhishing={isPhishing}>
      {isPhishing === null ? 'Loading...' : isPhishing ? '⚠️ This site may be a phishing attempt!' : '✅ This site looks safe.'}
    </BannerContainer>
  )
}
