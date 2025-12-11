from flask import Flask, request, jsonify
import sympy as sp
import math

app = Flask(__name__)

@app.route("/dirichlet")
def dirichlet():
    m = int(request.args.get("m", 10))
    N = int(request.args.get("N", 50_000))  # number of primes
    residues = [a for a in range(1, m) if math.gcd(a, m) == 1]
    phi = len(residues)

    counts = {a: 0 for a in residues}
    data = {a: [] for a in residues}

    primes = list(sp.primerange(2, sp.prime(N)))

    total = 0
    for idx, p in enumerate(primes, 1):
        total += 1
        r = p % m
        if r in counts:
            counts[r] += 1

        # Store every prime (accurate)
        for a in residues:
            data[a].append([idx, counts[a]/total])

    return jsonify(data)

if __name__ == "__main__":
    app.run(port=5000)
