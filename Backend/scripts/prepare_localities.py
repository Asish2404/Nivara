from pathlib import Path
import json
import pandas as pd
import geopandas as gpd

RAW = Path("data/raw")
OUT = Path("data/processed/localities.csv")


def read_geojsonl(path):
    features = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                features.append(json.loads(line))
    return gpd.GeoDataFrame.from_features(features, crs="EPSG:4326")


def safe_centroids(gdf):
    gdf = gdf.copy()

    if gdf.crs is None:
        gdf = gdf.set_crs(4326)

    gdf["geometry"] = gdf.geometry.make_valid()

    # Calculate centroids in an appropriate projected CRS.
    projected = gdf.to_crs(gdf.estimate_utm_crs())
    projected["centroid"] = projected.geometry.centroid
    cent = projected.set_geometry("centroid").to_crs(4326)

    return cent.geometry.y.to_numpy(), cent.geometry.x.to_numpy()


def main():
    kolkata_path = RAW / "kolkata.geojson"
    ulb_path = RAW / "WB_AMRUT_ULBs.geojsonl"

    if not kolkata_path.exists():
        raise FileNotFoundError(kolkata_path)
    if not ulb_path.exists():
        raise FileNotFoundError(ulb_path)

    # ------------------------------------------------------------
    # Kolkata wards
    # ------------------------------------------------------------
    kolkata = gpd.read_file(kolkata_path)

    if "WARD" not in kolkata.columns:
        raise ValueError(
            f"Expected WARD in Kolkata file. Columns: {list(kolkata.columns)}"
        )

    lat, lon = safe_centroids(kolkata)

    kolkata_out = pd.DataFrame({
        "locality": [f"Kolkata Ward {x}" for x in kolkata["WARD"].astype(str)],
        "source": "Kolkata Ward",
        "district": "Kolkata",
        "ward": kolkata["WARD"].astype(str).to_numpy(),
        "ulb_name": "",
        "lat": lat,
        "lon": lon,
        "area": None,
    })

    # ------------------------------------------------------------
    # North/South 24 Parganas ULBs
    # ------------------------------------------------------------
    ulbs = read_geojsonl(ulb_path)

    if "Dist_Code" not in ulbs.columns or "Name" not in ulbs.columns:
        raise ValueError(
            f"Expected Dist_Code and Name in ULB file. Columns: {list(ulbs.columns)}"
        )

    # In the supplied file:
    # 303 = North 24 Parganas
    # 304 = South 24 Parganas
    ulbs_24 = ulbs[ulbs["Dist_Code"].astype(str).isin(["303", "304"])].copy()

    lat, lon = safe_centroids(ulbs_24)

    district_map = {
        "303": "North 24 Parganas",
        "304": "South 24 Parganas",
    }

    ulb_out = pd.DataFrame({
        "locality": ulbs_24["Name"].astype(str).to_numpy(),
        "source": "AMRUT ULB",
        "district": ulbs_24["Dist_Code"].astype(str).map(district_map).to_numpy(),
        "ward": "",
        "ulb_name": ulbs_24["Name"].astype(str).to_numpy(),
        "lat": lat,
        "lon": lon,
        "area": pd.to_numeric(ulbs_24["Actual_Area"], errors="coerce").to_numpy()
        if "Actual_Area" in ulbs_24.columns else None,
    })

    # Avoid duplicate ULB names if the source ever contains repeats.
    ulb_out = ulb_out.drop_duplicates("locality")

    out = pd.concat([kolkata_out, ulb_out], ignore_index=True)

    # Keep locality names unique.
    out = out.drop_duplicates("locality").reset_index(drop=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(OUT, index=False)

    print(f"Kolkata wards: {len(kolkata_out)}")
    print(f"24 Parganas ULBs: {len(ulb_out)}")
    print(f"Total localities: {len(out)}")
    print(f"Saved: {OUT}")
    print(out.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
