// Real-time USD -> BRL conversion, powered by the `dolarhoje` crate
// (https://github.com/jaswdr/dolarhoje), which reads the current rate from
// https://dolarhoje.com. FlightFinder uses this to show every price in BRL.
//
// Usage:
//   usd-brl              prints the current USD->BRL rate, e.g. "5.1600"
//   usd-brl 57 349 1159  prints "USD <x> = BRL <x*rate>" for each amount
use std::env;

fn main() {
    let rate = match dolarhoje::get() {
        Ok(r) => r as f64,
        Err(e) => {
            eprintln!("erro ao obter cotacao USD->BRL (dolarhoje): {}", e);
            std::process::exit(1);
        }
    };

    let amounts: Vec<String> = env::args().skip(1).collect();
    if amounts.is_empty() {
        // No arguments: just emit the rate (4 decimals) for downstream math.
        println!("{:.4}", rate);
        return;
    }

    for a in &amounts {
        match a.parse::<f64>() {
            Ok(usd) => println!("USD {:.2} = BRL {:.2}", usd, usd * rate),
            Err(_) => eprintln!("valor invalido ignorado: {}", a),
        }
    }
}
