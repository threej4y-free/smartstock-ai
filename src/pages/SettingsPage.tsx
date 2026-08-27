import { useState } from 'react'
import { Bell, Building2, Check, Cloud, Database, PackageCheck, Save, SlidersHorizontal } from 'lucide-react'
import type { DataMode } from '../types'

type SettingsTab = 'general' | 'inventory' | 'forecast' | 'alerts' | 'data'

const tabs = [
  { id: 'general' as const, label: 'Geral', icon: Building2 },
  { id: 'inventory' as const, label: 'Estoque e validade', icon: PackageCheck },
  { id: 'forecast' as const, label: 'Previsões', icon: SlidersHorizontal },
  { id: 'alerts' as const, label: 'Alertas', icon: Bell },
  { id: 'data' as const, label: 'Dados e integrações', icon: Database },
]

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`settings-toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><i /></button>
}

export function SettingsPage({ expirationSafetyDays, dataMode, onUpdateExpirationSafety }: { expirationSafetyDays: number; dataMode: DataMode; onUpdateExpirationSafety: (days: number) => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [settings, setSettings] = useState({
    businessName: 'SmartStock Comércio', storeCode: 'LOJA-SP-01', timezone: 'America/Sao_Paulo', currency: 'BRL', language: 'pt-BR',
    serviceLevel: '95', reviewPeriod: '7', expirationSafety: String(expirationSafetyDays), defaultLeadTime: '10', negativeStock: false, fefo: true, blockExpired: true,
    forecastHorizon: '28', retraining: 'weekly', minimumHistory: '90', includeEvents: true, includePrices: true, automaticForecast: true,
    emailAlerts: true, dailyDigest: true, stockoutAlert: true, expirationAlert: true, overstockAlert: true, lowConfidenceAlert: true, email: 'operacao@smartstock.com.br',
  })
  const set = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => setSettings(current => ({ ...current, [key]: value }))
  const save = async () => {
    setSaving(true); setSaveError('')
    try {
      await onUpdateExpirationSafety(Number(settings.expirationSafety))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2800)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar a política.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="page-content settings-page">
    <div className="intro-row"><div><p>Defina regras que afetam previsões, recomendações de compra e alertas.</p>{saveError && <small className="form-error">{saveError}</small>}</div><button className="primary-button" disabled={saving} onClick={save}>{saved ? <Check size={16} /> : <Save size={16} />}{saving ? 'Salvando…' : saved ? 'Alterações salvas' : 'Salvar alterações'}</button></div>
    <div className="settings-layout">
      <aside className="settings-nav" aria-label="Seções de configurações">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}><Icon size={16} /><span>{tab.label}</span></button> })}</aside>
      <section className="panel settings-panel">
        {activeTab === 'general' && <div className="settings-section">
          <header><span>Identificação</span><h2>Configurações gerais</h2><p>Informações básicas usadas nos relatórios e na operação diária.</p></header>
          <div className="settings-fields two-columns">
            <label><span>Nome da operação</span><input value={settings.businessName} onChange={e => set('businessName', e.target.value)} /></label>
            <label><span>Código da loja</span><input value={settings.storeCode} onChange={e => set('storeCode', e.target.value)} /></label>
            <label><span>Fuso horário</span><select value={settings.timezone} onChange={e => set('timezone', e.target.value)}><option value="America/Sao_Paulo">Brasília · UTC−03:00</option><option value="America/Manaus">Manaus · UTC−04:00</option><option value="America/Rio_Branco">Rio Branco · UTC−05:00</option></select></label>
            <label><span>Moeda</span><select value={settings.currency} onChange={e => set('currency', e.target.value)}><option value="BRL">Real brasileiro · BRL</option><option value="USD">Dólar americano · USD</option></select></label>
            <label><span>Idioma da interface</span><select value={settings.language} onChange={e => set('language', e.target.value)}><option value="pt-BR">Português (Brasil)</option><option value="en">English</option></select></label>
          </div>
        </div>}

        {activeTab === 'inventory' && <div className="settings-section">
          <header><span>Políticas operacionais</span><h2>Estoque e validade</h2><p>Estas regras influenciam o ponto de reposição e a ordem de saída dos lotes.</p></header>
          <div className="settings-fields three-columns">
            <label><span>Nível de serviço</span><select value={settings.serviceLevel} onChange={e => set('serviceLevel', e.target.value)}><option value="90">90% · menor estoque</option><option value="95">95% · recomendado</option><option value="99">99% · maior proteção</option></select><small>Probabilidade desejada de atender a demanda sem ruptura.</small></label>
            <label><span>Período entre revisões</span><div className="unit-field"><input type="number" min="1" value={settings.reviewPeriod} onChange={e => set('reviewPeriod', e.target.value)} /><b>dias</b></div><small>Frequência usada para calcular o estoque-alvo.</small></label>
            <label><span>Prazo padrão do fornecedor</span><div className="unit-field"><input type="number" min="0" value={settings.defaultLeadTime} onChange={e => set('defaultLeadTime', e.target.value)} /><b>dias</b></div><small>Aplicado quando o produto não possui prazo próprio.</small></label>
            <label><span>Margem antes da validade</span><div className="unit-field"><input type="number" min="0" value={settings.expirationSafety} onChange={e => set('expirationSafety', e.target.value)} /><b>dias</b></div><small>Retira o lote da venda antes da data de vencimento.</small></label>
          </div>
          <div className="setting-rules">
            <div><span><strong>Usar FEFO automaticamente</strong><small>Consome primeiro o lote válido com vencimento mais próximo.</small></span><Toggle label="Usar FEFO automaticamente" checked={settings.fefo} onChange={value => set('fefo', value)} /></div>
            <div><span><strong>Bloquear lotes vencidos</strong><small>Lotes vencidos não entram no estoque disponível.</small></span><Toggle label="Bloquear lotes vencidos" checked={settings.blockExpired} onChange={value => set('blockExpired', value)} /></div>
            <div><span><strong>Permitir estoque negativo</strong><small>Não recomendado; pode esconder falhas no registro de movimentações.</small></span><Toggle label="Permitir estoque negativo" checked={settings.negativeStock} onChange={value => set('negativeStock', value)} /></div>
          </div>
        </div>}

        {activeTab === 'forecast' && <div className="settings-section">
          <header><span>Modelo de demanda</span><h2>Configurações das previsões</h2><p>Controle o horizonte, a atualização e os sinais considerados pelo modelo.</p></header>
          <div className="settings-fields three-columns">
            <label><span>Horizonte principal</span><select value={settings.forecastHorizon} onChange={e => set('forecastHorizon', e.target.value)}><option value="7">7 dias</option><option value="28">28 dias</option><option value="56">56 dias</option></select></label>
            <label><span>Retreinamento</span><select value={settings.retraining} onChange={e => set('retraining', e.target.value)}><option value="daily">Diário</option><option value="weekly">Semanal · recomendado</option><option value="monthly">Mensal</option></select></label>
            <label><span>Histórico mínimo</span><div className="unit-field"><input type="number" min="28" value={settings.minimumHistory} onChange={e => set('minimumHistory', e.target.value)} /><b>dias</b></div></label>
          </div>
          <div className="setting-rules">
            <div><span><strong>Gerar previsões automaticamente</strong><small>Atualiza as previsões após o fechamento diário.</small></span><Toggle label="Gerar previsões automaticamente" checked={settings.automaticForecast} onChange={value => set('automaticForecast', value)} /></div>
            <div><span><strong>Considerar calendário e eventos</strong><small>Inclui feriados, eventos e dia da semana no treinamento.</small></span><Toggle label="Considerar calendário e eventos" checked={settings.includeEvents} onChange={value => set('includeEvents', value)} /></div>
            <div><span><strong>Considerar preço e promoções</strong><small>Utiliza variações de preço quando os dados estão disponíveis.</small></span><Toggle label="Considerar preço e promoções" checked={settings.includePrices} onChange={value => set('includePrices', value)} /></div>
          </div>
          <div className="settings-info"><SlidersHorizontal size={16} /><p>As alterações serão aplicadas na próxima geração de previsões. O histórico é sempre dividido por tempo para impedir que o modelo aprenda com dados futuros.</p></div>
        </div>}

        {activeTab === 'alerts' && <div className="settings-section">
          <header><span>Comunicação operacional</span><h2>Alertas e notificações</h2><p>Escolha quais eventos precisam chamar a atenção da equipe.</p></header>
          <div className="settings-fields"><label><span>E-mail para notificações</span><input type="email" value={settings.email} onChange={e => set('email', e.target.value)} /></label></div>
          <div className="setting-rules">
            <div><span><strong>Enviar alertas por e-mail</strong><small>Habilita o envio para o endereço configurado acima.</small></span><Toggle label="Enviar alertas por e-mail" checked={settings.emailAlerts} onChange={value => set('emailAlerts', value)} /></div>
            <div><span><strong>Resumo diário</strong><small>Relatório consolidado enviado às 07:00.</small></span><Toggle label="Resumo diário" checked={settings.dailyDigest} onChange={value => set('dailyDigest', value)} /></div>
            <div><span><strong>Risco de ruptura</strong><small>Notificar quando a posição ficar abaixo do ponto de reposição.</small></span><Toggle label="Risco de ruptura" checked={settings.stockoutAlert} onChange={value => set('stockoutAlert', value)} /></div>
            <div><span><strong>Validade próxima</strong><small>Notificar em 30, 15 e 7 dias antes do vencimento.</small></span><Toggle label="Validade próxima" checked={settings.expirationAlert} onChange={value => set('expirationAlert', value)} /></div>
            <div><span><strong>Excesso de estoque</strong><small>Notificar quando a cobertura ultrapassar o limite recomendado.</small></span><Toggle label="Excesso de estoque" checked={settings.overstockAlert} onChange={value => set('overstockAlert', value)} /></div>
            <div><span><strong>Baixa confiança da previsão</strong><small>Notificar quando o intervalo P10–P90 estiver muito amplo.</small></span><Toggle label="Baixa confiança da previsão" checked={settings.lowConfidenceAlert} onChange={value => set('lowConfidenceAlert', value)} /></div>
          </div>
        </div>}

        {activeTab === 'data' && <div className="settings-section">
          <header><span>Fontes externas</span><h2>Dados e integrações</h2><p>Acompanhe as conexões usadas para alimentar vendas, produtos e previsões.</p></header>
          <div className="integration-list">
            <article><span className="integration-icon"><Database size={18} /></span><div><strong>Banco de dados principal</strong><small>{dataMode === 'api' ? 'FastAPI e PostgreSQL conectados' : 'Dados demonstrativos em memória'}</small></div><span className={`integration-status ${dataMode === 'api' ? 'connected' : 'demo'}`}>{dataMode === 'api' ? 'Conectado' : 'Demonstração'}</span><button>Configurar</button></article>
            <article><span className="integration-icon"><Cloud size={18} /></span><div><strong>Base M5 Forecasting</strong><small>Nenhum conjunto de dados importado</small></div><span className="integration-status offline">Não conectado</span><button>Importar dados</button></article>
            <article><span className="integration-icon"><Cloud size={18} /></span><div><strong>Sistema de vendas</strong><small>Integração via API ou arquivo CSV</small></div><span className="integration-status offline">Não conectado</span><button>Conectar</button></article>
          </div>
          <div className="settings-info"><Database size={16} /><p>{dataMode === 'api' ? 'Produtos, lotes, movimentos e políticas são persistidos pela API. Previsões continuam demonstrativas até a conexão do pipeline de ML.' : 'Os dados demonstrativos não representam desempenho real. Use VITE_DATA_MODE=api para exigir a conexão com o backend.'}</p></div>
        </div>}
      </section>
    </div>
  </div>
}
