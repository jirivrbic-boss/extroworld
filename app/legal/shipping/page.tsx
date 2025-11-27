export default function ShippingPage() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-white">Doprava A Dodací Podmínky</h1>
			<div className="prose prose-invert max-w-none">
				<h2>1. Způsob Dopravy</h2>
				<ul>
					<li>Česká pošta</li>
					<li>Zásilkovna</li>
					<li>Kurýrní služby (PPL, DPD, apod.)</li>
				</ul>
				<h2>2. Dodací Lhůty</h2>
				<p>Standardní dodací lhůta je 2–5 pracovních dnů po přijetí platby.</p>
				<p>Ve výjimečných případech může být dodací lhůta prodloužena, o čemž je Kupující včas informován.</p>
				<h2>3. Převzetí Zásilky</h2>
				<p>3.1 Kupující je povinen zásilku při převzetí zkontrolovat.</p>
				<p>3.2 V případě viditelného poškození zásilky je Kupující povinen poškození ihned řešit s dopravcem a sepsat zápis o škodě.</p>
				<p>3.3 Pozdější reklamace vnějšího poškození zásilky nemusí být uznána.</p>
			</div>
		</div>
	);
}


