import React from 'react';
import { PROJECT_TREE_TEXT } from '../data/androidProjectFiles';

const SPECS = [
  {
    number: '01.',
    title: 'ObdBluetoothManager.kt — ELM327 BluetoothSocket SPP & DTCs',
    description:
      'Lista dispositivos pareados e conecta via RFCOMM SPP (00001101-0000-1000-8000-00805F9B34FB). Envia ATZ, ATE0, ATL0, ATSP0 com timeout e reconexão automática. Lê RPM (010C), Velocidade (010D — priorizada sobre GPS), Temperatura do Motor (0105), Voltagem (ATRV), Carga (0104), MAF (0110) e MAP (010B), além de ler/limpar códigos de falha Mode 03/04 traduzidos para português.'
  },
  {
    number: '02.',
    title: 'SplashIntroOverlay.kt — Animação Cinematográfica (2,5s)',
    description:
      'Executada ao abrir o Launcher ou ao despertar a tela da multimídia (ACTION_SCREEN_ON). O carro desliza da lateral para o centro com fade-in, dois pontos radiais iluminam os faróis, uma linha neon acende sob o veículo e a saudação é digitada enquanto GPS, OBD2 e áudio inicializam em segundo plano. Inclui botão Pular e chave liga/desliga.'
  },
  {
    number: '03.',
    title: 'TripComputerManager.kt — Computador de Bordo & Custo (R$)',
    description:
      'Calcula em tempo real distância percorrida (km), tempo ativo, velocidade média, consumo instantâneo/médio (km/l), litros gastos e custo em Reais (R$). Quando o OBD2 está conectado utiliza MAF (0110) ou MAP (010B) + RPM + cilindrada configurável; sem OBD2 estima via GPS + cilindrada e combustível (Gasolina/Etanol).'
  },
  {
    number: '04.',
    title: 'Drive Lab / Saúde & Segurança Automotiva (minSdk 24)',
    description:
      'Modal dedicado para visualizar todos os sensores ao vivo e diagnosticar/limpar códigos P0xxx com o carro parado. Mantém trava em paisagem (landscape), botões >= 64dp e alto contraste noturno.'
  }
];

const MODULES = [
  {
    file: 'ObdBluetoothManager.kt',
    responsibility: 'BluetoothSocket SPP ELM327, loop assíncrono de PIDs (010C, 010D, 0105, ATRV, 0104, 0110, 010B) e Mode 03/04.'
  },
  {
    file: 'SplashIntroOverlay.kt',
    responsibility: 'Animação de entrada de 2,5s (slide do carro, faróis radiais, linha neon, texto digitado e botão Pular).'
  },
  {
    file: 'TripComputerManager.kt',
    responsibility: 'Distância, tempo de condução, velocidade média, km/l, litros consumidos e custo em R$ com Zerar Viagem.'
  },
  {
    file: 'DashboardScreen.kt',
    responsibility: 'Badge OBD2 no topo, arco RPM quando conectado, card compacto VIAGEM, modal Drive Lab / Saúde e gaveta.'
  }
];

export const ArchitectureSpecs: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="cockpit-card-metallic cockpit-glow-cyan rounded-2xl p-6 md:p-8">
        <h2 className="cockpit-readout font-display text-2xl font-bold text-white">
          Arquitetura Completa — OBD2, Splash Cinematográfico e Computador de Bordo
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          Evolução modular em Kotlin, Jetpack Compose, Coroutines e StateFlow compatível com centrais multimídias Android 7.0+ (minSdk 24).
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SPECS.map((spec) => (
            <div key={spec.number} className="cockpit-card-glass rounded-2xl p-6">
              <h3 className="font-display text-base font-bold text-white">
                <span className="mr-2 font-mono text-sky-400">{spec.number}</span>
                {spec.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{spec.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 cockpit-card-metallic rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold text-white">Estrutura de Pastas</h3>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-sky-400/20 bg-[#05080F]/90 p-4 font-mono text-xs leading-relaxed text-sky-200">
            {PROJECT_TREE_TEXT}
          </pre>
        </div>

        <div className="lg:col-span-7 cockpit-card-metallic rounded-2xl overflow-hidden">
          <div className="cockpit-card-glass border-b border-white/10 px-6 py-4 rounded-none">
            <h3 className="font-display text-lg font-bold text-white">Módulos Adicionados e Atualizados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-300">
                  <th className="px-6 py-3.5 font-semibold">Arquivo</th>
                  <th className="px-6 py-3.5 font-semibold">Responsabilidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MODULES.map((row) => (
                  <tr key={row.file} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-sky-300 whitespace-nowrap">
                      {row.file}
                    </td>
                    <td className="px-6 py-4 text-slate-200">{row.responsibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
