"""
VAJRA Unified CLI Tool
Command-line utility for training, evaluation, inference, and model export.
"""

import argparse
import json
import os
import sys

# Ensure ml directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from config import WEIGHTS_DIR


def main():
    parser = argparse.ArgumentParser(description="VAJRA Severe Weather Nowcasting CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Acquire data
    subparsers.add_parser("acquire", help="Fetch ERA5 reanalysis and DEM topography for Kedarnath 2013")

    # Preprocess
    subparsers.add_parser("preprocess", help="Normalize channels and generate sliding sequence tensors")

    # Train
    train_parser = subparsers.add_parser("train", help="Train VajraNowcastNet (ConvLSTM)")
    train_parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    train_parser.add_argument("--batch-size", type=int, default=4, help="Batch size")
    train_parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")

    # Evaluate
    subparsers.add_parser("evaluate", help="Evaluate trained checkpoint on validation set (POD, CSI, RMSE)")

    # Predict / Nowcast
    predict_parser = subparsers.add_parser("predict", help="Execute single nowcast inference pass")
    predict_parser.add_argument("--sample", type=int, default=15, help="Sample index from validation set")

    # Export
    export_parser = subparsers.add_parser("export", help="Export model to ONNX and TorchScript")
    export_parser.add_argument("--opset", type=int, default=18, help="ONNX opset version")

    args = parser.parse_args()

    if args.command == "acquire":
        from acquire_data import build_kedarnath_dataset
        build_kedarnath_dataset()

    elif args.command == "preprocess":
        from preprocess import run_preprocessing
        run_preprocessing()

    elif args.command == "train":
        from train import train_model
        train_model(epochs=args.epochs, batch_size=args.batch_size, learning_rate=args.lr)

    elif args.command == "evaluate":
        from evaluate import evaluate_trained_model
        evaluate_trained_model()

    elif args.command == "predict":
        from inference import VajraInferenceEngine
        engine = VajraInferenceEngine()
        res = engine.run_inference(sample_idx=args.sample)
        print(json.dumps(res, indent=2))

    elif args.command == "export":
        import torch
        from model import VajraNowcastNet
        checkpoint_path = os.path.join(WEIGHTS_DIR, "vajra_kedarnath_model.pt")
        ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        model = VajraNowcastNet()
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()

        dummy_x = torch.randn(1, 4, 8, 65, 35)

        # 1. TorchScript
        ts_path = os.path.join(WEIGHTS_DIR, "vajra_kedarnath_model.torchscript.pt")
        traced = torch.jit.trace(model, dummy_x)
        traced.save(ts_path)
        print(f"✓ TorchScript model exported to: {ts_path}")

        # 2. ONNX
        onnx_path = os.path.join(WEIGHTS_DIR, "vajra_kedarnath_model.onnx")
        torch.onnx.export(
            model,
            dummy_x,
            onnx_path,
            opset_version=args.opset,
            input_names=["meteo_sequence"],
            output_names=["rain_forecast", "hazard_probabilities"]
        )
        print(f"✓ ONNX model exported to: {onnx_path}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
