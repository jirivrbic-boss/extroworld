export default function ReturnsPage() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-white">Vrácení Zboží</h1>
			<div className="prose prose-invert max-w-none">
				<h2>1. Odstoupení Od Smlouvy</h2>
				<p>1.1 Kupující má právo odstoupit od smlouvy do 14 dnů bez udání důvodu.</p>
				<p>1.2 Lhůta pro odstoupení běží ode dne převzetí zboží.</p>

				<h2>2. Postup Při Odstoupení</h2>
				<p>2.1 Kupující oznámí odstoupení e‑mailem na <strong>store@extroworld.com</strong>.</p>
				<p>2.2 Zboží musí být vráceno na adresu, kterou určí prodávající, kompletní, nepoužité a v původním obalu.</p>

				<h2>3. Náklady Na Vrácení</h2>
				<p>3.1 Náklady na vrácení zboží nese Kupující.</p>
				<p>3.2 Kupující odpovídá za snížení hodnoty vraceného zboží v důsledku jeho nakládání nad rámec nutného k seznámení se s jeho povahou a vlastnostmi.</p>

				<h2>4. Výjimky Z Práva Na Odstoupení</h2>
				<p>Právo odstoupit od smlouvy nelze uplatnit u:</p>
				<ul>
					<li>zboží vyrobeného podle požadavků Kupujícího nebo přizpůsobeného jeho osobním potřebám,</li>
					<li>zboží, které bylo po dodání nenávratně smíseno s jiným zbožím.</li>
				</ul>

				<h2>5. Vrácení Peněz</h2>
				<p>5.1 Peníze budou Kupujícímu vráceny do 14 dnů od doručení vráceného zboží.</p>
				<p>5.2 Vrácení proběhne stejným způsobem, jakým byla platba přijata, není‑li dohodnuto jinak.</p>
			</div>
		</div>
	);
}


