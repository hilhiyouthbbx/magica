"use client";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowRight } from "lucide-react";

const products = [
  { name: "White Head – Royal Blue Hoodie", price: "$30", img: "https://static.wixstatic.com/media/458ec6_9feb392cb05a400696ecda0f4aea25db~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
  { name: "Blue Head – White Hoodie",       price: "$30", img: "https://static.wixstatic.com/media/458ec6_4072be1145a14bb9ace04af6b5fca89b~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
  { name: "2024 Hilhi – Red Hoodie",        price: "$30", img: "https://static.wixstatic.com/media/458ec6_2d9df852f82541ef9ccbf46ede7afc3f~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
  { name: "White H on RED Hoodie",          price: "$30", img: "https://static.wixstatic.com/media/458ec6_2fc519ef318f4c209f201b8d873c37a3~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
];

export function MerchPreview() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#060B17]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.08),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="flex items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <ShoppingCart className="w-3.5 h-3.5" /> Official Gear
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Rep Your <span className="text-gradient-red">Team</span>
            </h2>
            <p className="text-gray-400 mt-2 max-w-md">Hoodies, long sleeves, short sleeves — gear up in official Hilhi Youth Basketball apparel.</p>
          </div>
          <a href="/merch"
            className="hidden sm:flex flex-shrink-0 items-center gap-2 px-5 py-3 glass border border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm">
            Shop All <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p, i) => (
            <motion.a key={i} href="/merch"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/40 transition-all duration-300 card-hover">
              {/* Product image */}
              <div className="bg-white/95 aspect-square flex items-center justify-center p-4 overflow-hidden">
                <img src={p.img} alt={p.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-4">
                <div className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{p.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-400 font-black text-lg">{p.price}</span>
                  <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors font-medium">Order →</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8 sm:hidden">
          <a href="/merch"
            className="inline-flex items-center gap-2 px-6 py-3 glass border border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
            Shop All Gear <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
