'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useWizard } from '../wizard-context';

export function SpecsStep() {
  const { state, dispatch } = useWizard();
  const { data } = state;
  const showBhk = data.type === 'APARTMENT' || data.type === 'VILLA';

  const setNum =
    (field: 'bhk' | 'carpetArea' | 'superArea' | 'floor' | 'totalFloors') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({
        type: 'SET_FIELD',
        field,
        value: e.target.value ? Number(e.target.value) : undefined,
      });

  return (
    <div className="space-y-4">
      {showBhk && (
        <div>
          <label htmlFor="bhk" className="mb-1.5 block text-sm font-medium text-foreground">
            BHK
          </label>
          <Select
            id="bhk"
            value={data.bhk ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_FIELD',
                field: 'bhk',
                value: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">Select BHK</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
            <option value="5">5 BHK</option>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="carpetArea" className="mb-1.5 block text-sm font-medium text-foreground">
            Carpet area (sqft)
          </label>
          <Input
            id="carpetArea"
            type="number"
            value={data.carpetArea ?? ''}
            onChange={setNum('carpetArea')}
          />
        </div>
        <div>
          <label htmlFor="superArea" className="mb-1.5 block text-sm font-medium text-foreground">
            Super area (sqft)
          </label>
          <Input
            id="superArea"
            type="number"
            value={data.superArea ?? ''}
            onChange={setNum('superArea')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="floor" className="mb-1.5 block text-sm font-medium text-foreground">
            Floor
          </label>
          <Input id="floor" type="number" value={data.floor ?? ''} onChange={setNum('floor')} />
        </div>
        <div>
          <label htmlFor="totalFloors" className="mb-1.5 block text-sm font-medium text-foreground">
            Total floors
          </label>
          <Input
            id="totalFloors"
            type="number"
            value={data.totalFloors ?? ''}
            onChange={setNum('totalFloors')}
          />
        </div>
      </div>
      <div>
        <label htmlFor="facing" className="mb-1.5 block text-sm font-medium text-foreground">
          Facing
        </label>
        <Select
          id="facing"
          value={data.facing ?? ''}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'facing', value: e.target.value })}
        >
          <option value="">Select facing</option>
          <option value="N">North</option>
          <option value="S">South</option>
          <option value="E">East</option>
          <option value="W">West</option>
          <option value="NE">North-East</option>
          <option value="NW">North-West</option>
          <option value="SE">South-East</option>
          <option value="SW">South-West</option>
        </Select>
      </div>
      <div>
        <label htmlFor="furnishing" className="mb-1.5 block text-sm font-medium text-foreground">
          Furnishing
        </label>
        <Select
          id="furnishing"
          value={data.furnishing ?? ''}
          onChange={(e) =>
            dispatch({
              type: 'SET_FIELD',
              field: 'furnishing',
              value: e.target.value as never,
            })
          }
        >
          <option value="">Select furnishing</option>
          <option value="FURNISHED">Furnished</option>
          <option value="SEMI">Semi-furnished</option>
          <option value="UNFURNISHED">Unfurnished</option>
        </Select>
      </div>
    </div>
  );
}
