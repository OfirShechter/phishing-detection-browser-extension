import styled from "styled-components";
import { PhishingStatus } from "../../types/state.type";

export const BannerContainer = styled.div<{ phishingState: PhishingStatus }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  background-color: ${({ phishingState }) => {
    switch (phishingState) {
      case PhishingStatus.PHISHING:
        return "red";
      case PhishingStatus.LEGITIMATE:
        return "green";
      case PhishingStatus.PROCESSING:
        return "orange";
      case PhishingStatus.EXTENSION_INITIALIZING:
        return "gray";
      case PhishingStatus.ERROR:
        return "yellow";
      default:
        return "brown";
    }
  }};
  color: white;
  font-weight: bold;
  text-align: center;
  z-index: 9999;
`;
