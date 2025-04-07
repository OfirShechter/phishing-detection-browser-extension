import styled from 'styled-components'

export const BannerContainer = styled.div<{ isPhishing: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  background-color: ${({ isPhishing }) => (isPhishing ? 'red' : 'green')};
  color: white;
  font-weight: bold;
  text-align: center;
  z-index: 9999;
`