import csv
import math
import sympy as sp
from multiprocessing import Pool, cpu_count
import time


# Sieve of Eratosthenes — generate primes up to sqrt(N)
def sieve(limit):
    mark = [True] * (limit + 1)
    mark[0] = mark[1] = False
    for i in range(2, int(limit**0.5) + 1):
        if mark[i]:
            step = i
            for j in range(i*i, limit + 1, step):
                mark[j] = False
    return [i for i in range(2, limit + 1) if mark[i]]

# Factorization using the primes from the sieve
def factorize(n, primes):
    if n == 1:
        return []

    factors = []
    temp = n

    for p in primes:
        if p * p > temp:
            break
        if temp % p == 0:
            exp = 0
            while temp % p == 0:
                temp //= p
                exp += 1
            factors.append((p, exp))

    if temp > 1:
        # temp itself is prime
        factors.append((temp, 1))

    return factors

# Compute sigma(n) from factorization
def sigma_from_factors(factors):
    total = 1
    for p, e in factors:
        # 1 + p + p^2 + ... + p^e
        total *= (p**(e+1) - 1) // (p - 1)
    return total

# Pretty formatting for CSV
def format_factorization(factors):
    if not factors:
        return "1"
    out = []
    for p, e in factors:
        if e == 1:
            out.append(f"{p}")
        else:
            out.append(f"{p}^{e}")
    return " × ".join(out)

# Worker for multiprocessing
def process_range(args):
    start, end, primes = args
    rows = []

    for n in range(start, end + 1):
        fac = factorize(n, primes)
        sig = sigma_from_factors(fac)
        sigma_minus_n = sig - n
        fac_str = format_factorization(fac)
        rows.append((n, sigma_minus_n, fac_str))

    return rows

# Main
def compute_sigma_csv(N, filename):
    print(f"Computing for N = {N} on {cpu_count()} cores...")
    t_start = time.time()

    # Precompute primes
    primes = sieve(int(math.sqrt(N)) + 1)

    # Split work
    num_workers = cpu_count()
    chunk = N // num_workers
    args = []
    for i in range(num_workers):
        start = i * chunk + 1
        end = (i + 1) * chunk if i < num_workers - 1 else N
        args.append((start, end, primes))

    # Multiprocessing
    with Pool(num_workers) as pool:
        results = pool.map(process_range, args)

    t_end = time.time()
    print(f"Time taken: {t_end - t_start:.4f} s")

    # Write CSV
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["n", "sigma_minus_n", "factorization"])
        for block in results:
            for row in block:
                writer.writerow(row)

    print(f"Done. Output written to {filename}")

# -------------------------------------------------------------

# Dirichlet distribution data


if __name__ == "__main__":
    #compute_sigma_csv(100_000, "sigma.csv")


    pass