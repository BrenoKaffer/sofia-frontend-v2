// Utilitário para gerar sons de alerta usando Web Audio API

export class AlertSound {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  // Gerar um beep de alerta
  async playAlertBeep(frequency: number = 800, duration: number = 200) {
    if (!this.audioContext) {
      console.warn('AudioContext não disponível');
      return;
    }

    try {
      // Retomar o contexto se estiver suspenso
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      // Envelope para suavizar o som
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);

    } catch (error) {
      console.error('Erro ao reproduzir som de alerta:', error);
    }
  }

  // Som de alerta mais complexo (sequência de beeps)
  async playAlertSequence() {
    if (!this.audioContext) {
      console.warn('AudioContext não disponível');
      return;
    }

    try {
      // Sequência de 3 beeps
      await this.playAlertBeep(800, 150);
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.playAlertBeep(1000, 150);
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.playAlertBeep(800, 200);
    } catch (error) {
      console.error('Erro ao reproduzir sequência de alerta:', error);
    }
  }

  // Som de notificação mais suave
  async playNotificationSound() {
    if (!this.audioContext) {
      console.warn('AudioContext não disponível');
      return;
    }

    try {
      await this.playAlertBeep(600, 100);
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.playAlertBeep(800, 100);
    } catch (error) {
      console.error('Erro ao reproduzir som de notificação:', error);
    }
  }

  // Limpar recursos
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Instância singleton
let alertSoundInstance: AlertSound | null = null;

export function getAlertSound(): AlertSound {
  if (!alertSoundInstance) {
    alertSoundInstance = new AlertSound();
  }
  return alertSoundInstance;
}