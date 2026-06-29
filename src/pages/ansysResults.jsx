import FilteredModalChart from "../components/FilteredModalChart"
import Room1 from '../data/room1.json'
export default function AnsysResult() {
    return (
        <div>
            <FilteredModalChart rawData={Room1} />
        </div>
    )
}