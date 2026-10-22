/** Sello de validación: la propuesta ha sido revisada y validada por DataX Intelligence. */
export default function ValidadoDataX({ que }: { que: string }) {
  return (
    <aside className="card datax-sello" aria-label={`${que} revisado y validado por DataX Intelligence`}>
      <a href="https://datax.world" target="_blank" rel="noreferrer" aria-label="Web de DataX Intelligence">
        <img src="logos/datax-intelligence.png" alt="DataX Intelligence" width={180} height={48} />
      </a>
      <div>
        <div className="datax-tag">Revisado y validado</div>
        <p>
          {que} ha sido revisado y validado por <strong>DataX Intelligence</strong>.
        </p>
        <p className="datax-quien">
          DataX Intelligence es una empresa especializada en datos e inteligencia artificial.{' '}
          <a href="https://datax.world" target="_blank" rel="noreferrer">
            datax.world
          </a>
        </p>
      </div>
    </aside>
  )
}
