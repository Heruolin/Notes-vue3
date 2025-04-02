export interface ElectronAPI {
    openNote: (note: { title: string; content: string; backgroundColor: string; images: string[] }) => void;
  }
  
  declare global {
    interface Window {
      electron?: ElectronAPI;
    }
  }
  